import { TextUtil, Registry } from 'fptcore';

export function titleForResource(scriptContent, collectionName, resource) {
  const resourceName = TextUtil.singularize(collectionName);
  const resourceClass = Registry.resources[resourceName];
  if (resourceClass && resourceClass.getTitle) {
    return `(${resourceClass.getTitle(scriptContent, resource)})`;
  }
  return resource.title || 'No title';
}
