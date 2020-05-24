import { TextUtil, coreRegistry, coreWalker } from 'fptcore';

export function titleForResourceType(resourceType) {
  const resourceClass = coreRegistry.resources[resourceType];
  return resourceClass.title || TextUtil.titleForKey(resourceType);
}

export function titleForResource(scriptContent, collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceType];
  if (resourceClass && resourceClass.getTitle) {
    return resourceClass.getTitle(scriptContent, resource, coreRegistry,
      coreWalker);
  }
  return resource.title || 'No title';
}
