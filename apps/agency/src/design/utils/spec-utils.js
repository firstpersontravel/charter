import _ from 'lodash';

import { TextUtil, Validations } from 'fptcore';

export function typeTitleForSpec(spec) {
  if (Validations[spec.type] && Validations[spec.type].title) {
    return Validations[spec.type].title;
  }
  return TextUtil.titleForKey(spec.type);
}

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
