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
