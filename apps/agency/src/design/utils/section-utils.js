import _ from 'lodash';

export const sections = [
  ['roles', 'Roles'],
  ['locations', 'Locations'],
  ['variants', 'Variants'],
  ['media', 'Media']
];

const sectionContent = {
  roles: { roles: {}, appearances: {}, relays: {} },
  locations: { waypoints: {}, geofences: {}, routes: {} },
  variants: { variants: {}, departures: {}, times: {} },
  media: { layouts: {}, content_pages: {}, audio: {} }
};

const sliceContent = {
  scene: sliceName => (
    sliceName === 'all' ? {
      scenes: {}
    } : {
      scenes: { name: sliceName },
      pages: { scene: sliceName },
      triggers: { scene: sliceName },
      messages: { scene: sliceName },
      cues: { scene: sliceName },
      achievements: { scene: sliceName },
      checkpoints: { scene: sliceName }
    }
  ),
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
    `/design/script/${script.revision}` +
    `/${sliceType}/${sliceName}` +
    `/${collectionName}/${resourceName}`
  );
}
