import _ from 'lodash';

export const sections = [
  ['roles', 'Roles', 'user'],
  ['scenes', 'Scenes', 'map'],
  ['locations', 'Location', 'map-pin'],
  ['variants', 'Variants', 'space-shuttle'],
  ['interface', 'Interface', 'file-image-o']
];

const sectionContent = {
  roles: [{
    collection: 'roles',
    children: ['relays', 'inboxes']
  }],
  scenes: [{
    collection: 'scenes'
  }],
  locations: [{
    collection: 'waypoints',
    children: ['geofences']
  }, {
    collection: 'routes'
  }],
  variants: [{
    collection: 'variants'
  }, {
    collection: 'times'
  }],
  interface: [{
    collection: 'interfaces',
    children: ['content_pages']
  }, {
    collection: 'qr_codes'
  }]
};

function getGlobalSceneContent(sliceName) {
  return [{
    collection: 'triggers',
    filter: { scene: sliceName }
  }];
}

function getSceneContent(sliceName) {
  return [{
    collection: 'pages',
    filter: { scene: sliceName }
  }, {
    collection: 'cues',
    filter: { scene: sliceName }
  }, {
    collection: 'clips',
    filter: { scene: sliceName }
  }, {
    collection: 'triggers',
    filter: { scene: sliceName }
  }];
}

export function getSliceContent(scriptContent, sliceType, sliceName) {
  if (sliceType === 'scene') {
    const scene = scriptContent.scenes.find(s => s.name === sliceName);
    if (scene && scene.global) {
      return getGlobalSceneContent(sliceName);
    }
    return getSceneContent(sliceName);
  }
  if (sliceType === 'section') {
    return sectionContent[sliceName];
  }
  return null;
}

export function getContentList(scriptContent, sliceType, sliceName) {
  const contentMap = getSliceContent(scriptContent, sliceType, sliceName);
  if (!contentMap) {
    return {};
  }
  return Object.fromEntries(contentMap.map((contentMapItem) => {
    const collectionName = contentMapItem.collection;
    const items = contentMapItem.filter
      ? _.filter(scriptContent[collectionName], contentMapItem.filter)
      : scriptContent[collectionName];
    return [contentMapItem.collection, items];
  }));
}

function sliceForResource(collectionName, resource) {
  if (collectionName === 'scenes') {
    return { sliceType: 'scene', sliceName: resource.name };
  }
  if (resource.scene) {
    return { sliceType: 'scene', sliceName: resource.scene };
  }
  const section = _.find(Object.keys(sectionContent), sectionName => (
    !!sectionContent[sectionName][collectionName]
  ));
  return { sliceType: 'section', sliceName: section };
}

export function urlForResource(script, collectionName, resourceName) {
  const collection = script.content[collectionName];
  const resource = _.find(collection, { name: resourceName });
  const { sliceType, sliceName } = sliceForResource(collectionName, resource);
  return (
    `/${script.org.name}/${script.experience.name}` +
    `/script/${script.revision}` +
    `/design/${sliceType}/${sliceName}` +
    `/${collectionName}/${resourceName}`
  );
}
