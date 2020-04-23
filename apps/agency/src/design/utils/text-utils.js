import { TextUtil, coreRegistry } from 'fptcore';

export function titleForResource(scriptContent, collectionName, resource) {
  const resourceName = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceName];
  if (resourceClass && resourceClass.getTitle) {
    return resourceClass.getTitle(scriptContent, resource, coreRegistry);
  }
  return resource.title || 'No title';
}
