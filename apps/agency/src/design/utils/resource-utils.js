import _ from 'lodash';

const defaultFnsBySpecType = {
  media: () => `media-${Math.floor(Math.random() * 10000000).toString()}`
};

export function doesSpecHaveDefault(spec) {
  if (spec.default) {
    return true;
  }
  if (defaultFnsBySpecType[spec.type]) {
    return true;
  }
  return false;
}

export function defaultForSpec(spec) {
  if (_.isFunction(spec.default)) {
    return spec.default();
  }
  if (!_.isUndefined(spec.default)) {
    return spec.default;
  }
  if (defaultFnsBySpecType[spec.type]) {
    return defaultFnsBySpecType[spec.type]();
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
