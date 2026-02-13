const FptCore = require('fptcore').default;

export function titleForResourceType(resourceType) {
  const resourceClass = FptCore.coreRegistry.resources[resourceType];
  return resourceClass.title || FptCore.TextUtil.titleForKey(resourceType);
}

export function titleForResource(scriptContent, collectionName, resource) {
  const resourceType = FptCore.TextUtil.singularize(collectionName);
  const resourceClass = FptCore.coreRegistry.resources[resourceType];
  if (resourceClass && resourceClass.getTitle) {
    return resourceClass.getTitle(scriptContent, resource, FptCore.coreRegistry,
      FptCore.coreWalker);
  }
  return resource.title || 'No title';
}
