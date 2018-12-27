import _ from 'lodash';

import { ScriptValidationCore } from 'fptcore';

export function getItems(script, collectionName) {
  return script.content[collectionName] || [];
}

export function doesCollectionHaveScene(collectionName) {
  const collectionDeps = ScriptValidationCore.SCRIPT_DEPENDENCY_TREE[collectionName];
  return !!_.get(collectionDeps, 'scene');
}
