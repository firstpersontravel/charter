import _ from 'lodash';

export const sections = [
  ['roles', 'Roles', 'user'],
  ['scenes', 'Scenes', 'map'],
  ['messaging', 'Messaging', 'comment'],
  ['locations', 'Location', 'map-pin'],
  ['variants', 'Variants', 'space-shuttle'],
  ['interface', 'Interface', 'file-image-o'],
  ['operations', 'Operations', 'gear']
];

const sectionContent = {
  roles: { roles: {}, appearances: {} },
  scenes: { scenes: {} },
  messaging: { relays: {}, inboxes: {} },
  locations: { waypoints: {}, geofences: {}, routes: {} },
  variants: { variants: {}, departures: {}, times: {} },
  interface: { layouts: {}, content_pages: {} },
  operations: { achievements: {}, checkpoints: {} }
};

const sliceContent = {
  scene: sliceName => ({
    pages: { scene: sliceName },
    triggers: { scene: sliceName },
    emails: { scene: sliceName },
    cues: { scene: sliceName },
    audio: { scene: sliceName },
    clips: { scene: sliceName }
  }),
  section: sliceName => sectionContent[sliceName]
};

export function getSliceContent(sliceType, sliceName) {
  if (!sliceContent[sliceType]) {
    return null;
  }
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
    `/script/${script.revision}` +
    `/design/${sliceType}/${sliceName}` +
    `/${collectionName}/${resourceName}`
  );
}
