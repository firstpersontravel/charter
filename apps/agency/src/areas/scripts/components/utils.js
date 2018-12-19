import _ from 'lodash';

import { ScriptCore } from 'fptcore';

export function getItems(script, collectionName) {
  if (_.includes(ScriptCore.IMPLICIT_COLLECTION_NAMES, collectionName)) {
    return ScriptCore.gatherImplicitResources(script)[collectionName];
  }
  return script.content[collectionName] || [];
}
