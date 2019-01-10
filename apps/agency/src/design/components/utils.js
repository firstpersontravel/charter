import { TextUtil, ResourcesRegistry } from 'fptcore';

export const sections = [
  ['roles', 'Roles'],
  ['locations', 'Locations'],
  ['variants', 'Variants'],
  ['media', 'Media']
];

export function titleForResource(collectionName, resource) {
  const resourceName = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceName];
  if (resourceClass.title) {
    return `(${resourceClass.title(resource)})`;
  }
  return resource.title || 'No title';
}
