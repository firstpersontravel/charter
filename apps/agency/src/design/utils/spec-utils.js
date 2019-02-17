import _ from 'lodash';

import { TextUtil } from 'fptcore';

export function labelForSpec(spec, key) {
  if (spec.title) {
    return spec.title;
  }
  let simpleKey = key.replace('_name', '');
  if (spec.type === 'reference') {
    const resourceType = TextUtil.singularize(spec.collection);
    simpleKey = simpleKey.replace(`_${resourceType}`, '');
  }
  return _.startCase(simpleKey);
}
