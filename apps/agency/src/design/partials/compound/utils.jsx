import _ from 'lodash';

import {
  defaultForSpec,
  doesSpecHaveDefault
} from '../../utils/resource-utils';

export const newItemsForSpecType = {
  string: '',
  email: '',
  simpleValue: '',
  number: 0,
  boolean: null,
  enum: '',
  timeOffset: '',
  name: '',
  media: '',
  coords: null,
  timeShorthand: '',
  simpleAttribute: '',
  lookupable: '',
  reference: '',
  markdown: '',
  dictionary: {},
  list: [],
  object: {},
  component: null
};

export function newItemForSpec(spec) {
  if (spec.type === 'object') {
    return _(spec.properties)
      .keys()
      .filter(key => doesSpecHaveDefault(spec.properties[key]))
      .map(key => [key, defaultForSpec(spec.properties[key])])
      .fromPairs()
      .value();
  }
  return newItemsForSpecType[spec.type];
}
