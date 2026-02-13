import _ from 'lodash';

const FptCore = require('fptcore').default;

export const sections = [
  ['roles', 'Roles', 'user'],
  ['places', 'Places', 'map-pin'],
  ['defaults', 'Defaults', 'list-ul']
];

const sectionFilters = {
  roles: [{
    collection: 'roles',
    children: ['relays', 'inboxes']
  }, {
    collection: 'interfaces',
    children: ['content_pages']
  }],
  scenes: [{
    collection: 'scenes'
  }],
  places: [{
    collection: 'waypoints',
    children: ['geofences']
  }, {
    collection: 'routes'
  }],
  defaults: [{
    collection: 'variants'
  }, {
    collection: 'times'
  }]
};

function getGlobalSceneFilters(scriptContent, sceneName) {
  return [{
    collection: 'triggers',
    filter: { scene: sceneName }
  }];
}

function isTriggerOnResources(trigger, collectionName, resources) {
  if (!trigger.event) {
    return false;
  }
  const eventClass = FptCore.coreRegistry.events[trigger.event.type];
  if (eventClass.parentCollectionName !== collectionName) {
    return false;
  }
  const specParentProp = eventClass.parentCollectionSpecProperty;
  if (!specParentProp) {
    return false;
  }
  const resourceNames = resources.map(r => r.name);
  const eventParentVal = trigger.event[specParentProp];
  return resourceNames.includes(eventParentVal);
}

function isTriggerOnPages(trigger, pages) {
  if (!trigger.event) {
    return false;
  }
  const panelIds = new Set();
  // eslint-disable-next-line no-restricted-syntax
  for (const page of pages) {
    FptCore.coreWalker.walkResource('page', page, 'panels', (panel) => {
      panelIds.add(panel.id);
    });
  }
  const eventClass = FptCore.coreRegistry.events[trigger.event.type];
  if (eventClass.parentComponentType !== 'panels') {
    return false;
  }
  const specParentProp = eventClass.parentComponentSpecProperty;
  if (!specParentProp) {
    return false;
  }
  const eventParentVal = trigger.event[specParentProp];
  return panelIds.has(eventParentVal);
}

function isTriggerOnPage(trigger, page) {
  return isTriggerOnPages(trigger, [page]);
}

export function isTriggerOnPageInScene(scriptContent, trigger, sceneName) {
  const pagesInScene = (scriptContent.pages || [])
    .filter(p => p.scene === sceneName);
  return isTriggerOnPages(trigger, pagesInScene);
}

function getPageFilters(scriptContent, sceneName, iface) {
  return {
    key: `${sceneName}-pages-${iface.name}`,
    title: `${iface.title} page`,
    collection: 'pages',
    filter: { scene: sceneName, interface: iface.name },
    nested: [{
      collection: 'triggers',
      filterFn: (page, trigger) => isTriggerOnPage(trigger, page)
    }]
  };
}

function getSceneFilters(scriptContent, sceneName) {
  const pageSections = (scriptContent.interfaces || [])
    .map(i => getPageFilters(scriptContent, sceneName, i));

  const sceneSections = [{
    collection: 'clips',
    filter: { scene: sceneName },
    nested: [{
      collection: 'triggers',
      filterFn: (clip, trigger) => isTriggerOnResources(trigger, 'clips',
        [clip])
    }]
  }, {
    collection: 'cues',
    filter: { scene: sceneName },
    nested: [{
      collection: 'triggers',
      filterFn: (cue, trigger) => isTriggerOnResources(trigger, 'cues', [cue])
    }]
  }, {
    collection: 'triggers',
    filter: { scene: sceneName },
    filterFn: (t) => {
      if (isTriggerOnPageInScene(scriptContent, t, sceneName)) {
        return false;
      }
      const cues = _.filter(scriptContent.cues, { scene: sceneName });
      if (isTriggerOnResources(t, 'cues', cues)) {
        return false;
      }
      const clips = _.filter(scriptContent.clips, { scene: sceneName });
      if (isTriggerOnResources(t, 'clips', clips)) {
        return false;
      }
      return true;
    }
  }];
  return pageSections.concat(sceneSections);
}

export function getSliceFilters(scriptContent, sliceType, sliceName) {
  if (sliceType === 'scene') {
    const scenes = scriptContent.scenes || [];
    const scene = scenes.find(s => s.name === sliceName);
    if (scene && scene.global) {
      return getGlobalSceneFilters(scriptContent, sliceName);
    }
    return getSceneFilters(scriptContent, sliceName);
  }
  if (sliceType === 'section') {
    return sectionFilters[sliceName];
  }
  return null;
}

function getNestedItems(scriptContent, nestedFilter, parentResource) {
  const allItems = scriptContent[nestedFilter.collection] || [];
  const items = allItems.filter(i => nestedFilter.filterFn(parentResource, i));
  return {
    collection: nestedFilter.collection,
    items: items
  };
}

function getItem(scriptContent, contentFilter, resource) {
  const nested = (contentFilter.nested || [])
    .map(f => getNestedItems(scriptContent, f, resource));
  return {
    resource: resource,
    nested: nested
  };
}

function filterItems(scriptContent, contentFilter) {
  const allItems = scriptContent[contentFilter.collection] || [];
  const prefilteredItems = contentFilter.filter
    ? _.filter(allItems, contentFilter.filter)
    : allItems;
  const filteredItems = contentFilter.filterFn
    ? prefilteredItems.filter(contentFilter.filterFn)
    : prefilteredItems;
  return filteredItems;
}

function getItems(scriptContent, contentFilter) {
  const items = filterItems(scriptContent, contentFilter);
  return items.map(i => getItem(scriptContent, contentFilter, i));
}

function filterContent(scriptContent, contentFilter) {
  const items = getItems(scriptContent, contentFilter);
  return {
    key: contentFilter.key,
    title: contentFilter.title,
    collection: contentFilter.collection,
    filter: contentFilter.filter,
    items: items,
    children: contentFilter.children
  };
}

export function getSliceContent(scriptContent, sliceType, sliceName) {
  const filters = getSliceFilters(scriptContent, sliceType, sliceName);
  if (!filters) {
    return [];
  }
  return filters.map(filter => filterContent(scriptContent, filter));
}

function sectionForResource(scriptContent, collectionName, resource) {
  // eslint-disable-next-line no-restricted-syntax
  for (const sectionName of Object.keys(sectionFilters)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const sectionFilter of sectionFilters[sectionName]) {
      if (sectionFilter.collection === collectionName) {
        return sectionName;
      }
      if (sectionFilter.children
          && sectionFilter.children.includes(collectionName)) {
        return sectionName;
      }
    }
  }
  throw new Error(`Could not find section for ${collectionName}.`);
}

function sliceForResource(scriptContent, collectionName, resource) {
  if (collectionName === 'scenes') {
    return { sliceType: 'scene', sliceName: resource.name };
  }
  if (resource.scene) {
    return { sliceType: 'scene', sliceName: resource.scene };
  }
  const sectionName = sectionForResource(scriptContent, collectionName,
    resource);
  return { sliceType: 'section', sliceName: sectionName };
}

export function urlForResource(script, collectionName, resourceName) {
  const collection = script.content[collectionName];
  const resource = _.find(collection, { name: resourceName });
  const { sliceType, sliceName } = sliceForResource(script.content,
    collectionName, resource);
  return (
    `/${script.org.name}/${script.experience.name}`
    + `/script/${script.revision}`
    + `/design/${sliceType}/${sliceName}`
    + `/${collectionName}/${resourceName}`
  );
}
