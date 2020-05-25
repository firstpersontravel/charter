import _ from 'lodash';

export const sections = [
  ['roles', 'Roles', 'user'],
  ['scenes', 'Scenes', 'map'],
  ['places', 'Places', 'map-pin'],
  ['variants', 'Variants', 'space-shuttle']
];

const sectionContent = {
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
  variants: [{
    collection: 'variants'
  }, {
    collection: 'times'
  }]
};

function getGlobalSceneContent(scriptContent, sceneName) {
  return [{
    collection: 'triggers',
    filter: { scene: sceneName }
  }];
}

function getSceneContent(scriptContent, sceneName) {
  const pageSections = (scriptContent.interfaces || []).map(i => ({
    key: `${sceneName}-pages-${i.name}`,
    title: `${i.title} page`,
    collection: 'pages',
    filter: { scene: sceneName, interface: i.name }
  }));
  const sceneSections = [{
    collection: 'cues',
    filter: { scene: sceneName }
  }, {
    collection: 'clips',
    filter: { scene: sceneName }
  }, {
    collection: 'triggers',
    filter: { scene: sceneName }
  }];
  return pageSections.concat(sceneSections);
}

export function getSliceContent(scriptContent, sliceType, sliceName) {
  if (sliceType === 'scene') {
    const scene = scriptContent.scenes.find(s => s.name === sliceName);
    if (scene && scene.global) {
      return getGlobalSceneContent(scriptContent, sliceName);
    }
    return getSceneContent(scriptContent, sliceName);
  }
  if (sliceType === 'section') {
    return sectionContent[sliceName];
  }
  return null;
}

export function getContentListItem(scriptContent, contentMapItem) {
  const collectionName = contentMapItem.collection;
  const items = contentMapItem.filter
    ? _.filter(scriptContent[collectionName], contentMapItem.filter)
    : scriptContent[collectionName];
  return {
    key: contentMapItem.key,
    title: contentMapItem.title,
    collection: contentMapItem.collection,
    filter: contentMapItem.filter,
    items: items
  };
}

export function getContentList(scriptContent, sliceType, sliceName) {
  const contentMap = getSliceContent(scriptContent, sliceType, sliceName);
  if (!contentMap) {
    return [];
  }
  return contentMap.map(item => getContentListItem(scriptContent, item));
}

function sectionForResource(scriptContent, collectionName, resource) {
  // eslint-disable-next-line no-restricted-syntax
  for (const sectionName of Object.keys(sectionContent)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const sectionContentItem of sectionContent[sectionName]) {
      if (sectionContentItem.collection === collectionName) {
        return sectionName;
      }
      if (sectionContentItem.children &&
          sectionContentItem.children.includes(collectionName)) {
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
    `/${script.org.name}/${script.experience.name}` +
    `/script/${script.revision}` +
    `/design/${sliceType}/${sliceName}` +
    `/${collectionName}/${resourceName}`
  );
}
