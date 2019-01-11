import { TextUtil, ResourcesRegistry } from 'fptcore';

export function titleForResource(collectionName, resource) {
  const resourceName = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceName];
  if (resourceClass.getTitle) {
    return `(${resourceClass.getTitle(resource)})`;
  }
  return resource.title || 'No title';
}
