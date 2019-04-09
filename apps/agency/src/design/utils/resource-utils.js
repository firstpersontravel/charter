import _ from 'lodash';

export function doesSpecHaveDefault(spec) {
  return !!spec.default;
}

export function defaultForSpec(spec) {
  if (_.isFunction(spec.default)) {
    return spec.default();
  }
  if (!_.isUndefined(spec.default)) {
    return spec.default;
  }
  return null;
}

export function defaultFieldsForClass(resourceClass) {
  const fields = {};
  Object.keys(resourceClass.properties).forEach((key) => {
    const spec = resourceClass.properties[key];
    if (doesSpecHaveDefault(spec)) {
      fields[key] = defaultForSpec(spec);
    }
  });
  return fields;
}

// Characters for resource ids.
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz';

export function newResourceNameForType(resourceType) {
  const newId = _.range(6).map(i => (
    ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length))
  )).join('');
  return `${resourceType}-${newId}`;
}
