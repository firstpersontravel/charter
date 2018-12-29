import _ from 'lodash';

import { ResourcesRegistry } from 'fptcore';

export function getItems(script, collectionName) {
  return script.content[collectionName] || [];
}

export function doesCollectionHaveScene(collectionName) {
  const resourceName = _.endsWith(collectionName, 's') ?
    collectionName.substr(0, collectionName.length - 1) : collectionName;
  const resource = ResourcesRegistry[resourceName];
  return !!resource.properties.scene;
}
