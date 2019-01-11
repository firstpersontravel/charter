import _ from 'lodash';
import { TextUtil, ResourcesRegistry } from 'fptcore';

export const sections = [
  ['roles', 'Roles'],
  ['locations', 'Locations'],
  ['variants', 'Variants'],
  ['media', 'Media']
];

const sectionContent = {
  roles: { roles: {}, appearances: {}, relays: {} },
  locations: { waypoints: {}, geofences: {}, routes: {} },
  variants: { variants: {}, departures: {} },
  media: { layouts: {}, content_pages: {}, audio: {} }
};

const sliceContent = {
  scene: sliceName => ({
    scenes: { name: sliceName },
    pages: { scene: sliceName },
    triggers: { scene: sliceName },
    messages: { scene: sliceName },
    cues: { scene: sliceName },
    achievements: { scene: sliceName },
    times: { scene: sliceName },
    checkpoints: { scene: sliceName }
  }),
  section: sliceName => sectionContent[sliceName]
};

export function getSliceContent(sliceType, sliceName) {
  return sliceContent[sliceType](sliceName);
}

export function getContentList(scriptContent, sliceType, sliceName) {
  const contentMap = getSliceContent(sliceType, sliceName);
  return _.mapValues(contentMap, (filters, collectionName) => (
    _.filter(scriptContent[collectionName], filters)
  ));
}

export function titleForResource(collectionName, resource) {
  const resourceName = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceName];
  if (resourceClass.getTitle) {
    return `(${resourceClass.getTitle(resource)})`;
  }
  return resource.title || 'No title';
}

function getChildClaims(collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  return resourceClass.getChildClaims ?
    resourceClass.getChildClaims(resource) :
    null;
}

function getParentClaims(collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  return resourceClass.getParentClaims ?
    resourceClass.getParentClaims(resource) :
    null;
}

function addToList(existing, toAdd) {
  if (!existing) {
    return [toAdd];
  }
  if (existing.indexOf(toAdd) > -1) {
    return existing;
  }
  existing.push(toAdd);
  return existing;
}

/**
 * Gather list of parent claims by child.
 */
export function assembleParentClaims(scriptContent, contentList) {
  // A dict of child object to all claimed parents for that child.
  const parentsByChild = {};
  const collectionNames = Object.keys(contentList);
  // Gather a list of extra parents -- as we go through the map, some resources
  // will claim parents that aren't in the original content list. We'll go
  // through those in a second pass to ensure we have all parents of all
  // items in the content list.
  const resourceStack = [];
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      // For each item in the collection, get the claimed children, and
      // for each of those claimed children, add self as a parent.
      const resourceStr = `${collectionName}.${resource.name}`;
      const childStrs = getChildClaims(collectionName, resource);
      _.each(childStrs, (childStr) => {
        parentsByChild[childStr] = addToList(parentsByChild[childStr],
          resourceStr);
      });
      // And add this item to the stack to iterate through.
      resourceStack.push(resourceStr);
    });
  });
  // Now go through all the parents and ensure their parents get added to the
  // map recursively.
  while (resourceStack.length) {
    const resourceStr = resourceStack.pop();
    const [collectionName, resourceName] = resourceStr.split('.');
    const collection = scriptContent[collectionName];
    const resource = _.find(collection, { name: resourceName });
    const parentStrs = getParentClaims(collectionName, resource);
    _.each(parentStrs, (parentStr) => {
      // Add to parents map
      parentsByChild[resourceStr] = addToList(parentsByChild[resourceStr],
        parentStr);
      // And check to see if the claimed parent is inside the content list.
      // If it isn't, we'll add it to the extra parents list and we'll make
      // sure we capture the recursive parents of those objects.
      const parentCollectionName = parentStr.split('.')[0];
      if (!contentList[parentCollectionName]) {
        resourceStack.push(parentStr);
      }
    });
  }
  return parentsByChild;
}

/**
 * Return list of parent paths from a given resource string to the root.
 */
export function getParenthoodPaths(scriptContent, resourceStr, parentClaims) {
  // Paths will be tip -> child -> child -> parent
  const completedPaths = [];
  const inProgressPaths = [[resourceStr]];

  while (inProgressPaths.length) {
    // Pull an in progress path from the list of possibilities
    const curPath = inProgressPaths.pop();
    // Get the last item -- which is the closest parent yet found.
    const curCursor = curPath[curPath.length - 1];
    // Get the parents of that item.
    const curParents = parentClaims[curCursor];
    if (!curParents || curParents.length === 0) {
      // If no parents were claimed by this tip, then that path is
      // complete and we move it into the completed paths section.
      completedPaths.push(curPath);
    } else {
      // If any parents were claimed, then for each parent, add it to
      // the end of the current path and then re-add to the in progress
      // paths to iterate through.
      _.each(curParents, (parent) => {
        inProgressPaths.push(curPath.concat([parent]));
      });
    }
  }

  return completedPaths;
}

export function prepareContentTree(scriptContent, contentList) {
  // First gather child claims for complicated cases: a dict
  // of the child object to an array of claimed parent objects.
  const parentClaims = assembleParentClaims(scriptContent, contentList);

  // Now place each item in the content tree.
  const contentTree = {};
  const collectionNames = Object.keys(contentList);
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      // For each item, create a path by finding each parent in turn
      // until there are no more parents.
      const resourceStr = `${collectionName}.${resource.name}`;

      // Paths will be tip -> child -> child -> parent
      const parenthoodPaths = getParenthoodPaths(scriptContent, resourceStr,
        parentClaims);

      // Then iterate through all completed paths in reverse to place each item
      // in the path in the content tree. If any item isn't in the content
      // list, no problem, it'll be fetched later.
      _.each(parenthoodPaths, (completedPath) => {
        let treeCursor = contentTree;
        // Iterate through completed path from parent to tip.
        _.eachRight(completedPath, (pathEntry) => {
          if (!treeCursor[pathEntry]) {
            treeCursor[pathEntry] = {};
          }
          treeCursor = treeCursor[pathEntry];
        });
      });
    });
  });
  return contentTree;
}
