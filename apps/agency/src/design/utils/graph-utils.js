import _ from 'lodash';

import { coreRegistry, TextUtil } from 'fptcore';

const walkers = {
  reference: (spec, value, iteree) => {
    iteree(spec.collection, value);
  },
  params: (spec, value, iteree) => {
    _.each(spec, (paramSpec, key) => {
      if (walkers[paramSpec.type]) {
        walkers[paramSpec.type](paramSpec, value[key], iteree);
      }
    });
  },
  list: (spec, value, iteree) => {
    _.each(value, (item) => {
      if (walkers[spec.items.type]) {
        walkers[spec.items.type](spec.items, item, iteree);
      }
    });
  },
  dictionary: (spec, value, iteree) => {
    _.each(value, (val, key) => {
      if (walkers[spec.keys.type]) {
        walkers[spec.keys.type](spec.keys, key, iteree);
      }
      if (walkers[spec.values.type]) {
        walkers[spec.values.type](spec.values, val, iteree);
      }
    });
  },
  object: (spec, value, iteree) => {
    _.each(spec, (propSpec, key) => {
      if (walkers[propSpec.type]) {
        const propValue = value && value[key];
        walkers[propSpec.type](propSpec, propValue, iteree);
      }
    });
  },
  component: (spec, value, iteree) => {
    const variety = coreRegistry.getComponentVariety(spec, value);
    const mergedClass = coreRegistry.getComponentClass(spec, variety);
    walkers.object(mergedClass.properties, value, iteree);
  }
};

function walkReferences(collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceType];
  if (!resourceClass) {
    return [];
  }
  const references = [];
  walkers.params(resourceClass.properties, resource, (c, r) => {
    if (r) {
      references.push(`${c}.${r}`);
    }
  });
  return references;
}

export function assembleReverseReferences(scriptContent) {
  const graph = {};
  _.each(scriptContent, (collection, collectionName) => {
    if (collectionName === 'meta') {
      return;
    }
    _.each(collection, (resource) => {
      const resourceStr = `${collectionName}.${resource.name}`;
      const resourceRefs = walkReferences(collectionName, resource);
      _.each(resourceRefs, (ref) => {
        if (!graph[ref]) {
          graph[ref] = [];
        }
        if (graph[ref].indexOf(resourceStr) === -1) {
          graph[ref].push(resourceStr);
        }
      });
    });
  });
  return graph;
}

function getParentKey(resourceType) {
  return Object
    .keys(coreRegistry.resources[resourceType].properties)
    .find((key) => {
      const property = coreRegistry.resources[resourceType].properties[key];
      return property.type === 'reference' && property.parent;
    });
}

export function getChildResourceTypes(collectionName) {
  return _(coreRegistry.resources)
    .keys()
    .filter(childResourceType => (
      _.some(coreRegistry.resources[childResourceType].properties, property => (
        property.type === 'reference' &&
        property.collection === collectionName &&
        property.parent
      ))
    ))
    .value();
}

export function getChildren(scriptContent, resource, childCollectionName) {
  const childResourceType = TextUtil.singularize(childCollectionName);
  const parentKey = getParentKey(childResourceType);
  return _.filter(scriptContent[childCollectionName], {
    [parentKey]: resource.name
  });
}
