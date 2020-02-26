import _ from 'lodash';

const defaultFnsBySpecType = {
  media: () => `media-${Math.floor(Math.random() * 10000000).toString()}`
};

export function doesSpecHaveDefault(spec) {
  if (spec.default !== undefined) {
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
  if (spec.default !== undefined) {
    return spec.default;
  }
  if (defaultFnsBySpecType[spec.type]) {
    return defaultFnsBySpecType[spec.type]();
  }
  return null;
}

export function defaultFieldsForSpecs(specs) {
  const fields = {};
  Object.keys(specs).forEach((key) => {
    const spec = specs[key];
    if (doesSpecHaveDefault(spec)) {
      fields[key] = defaultForSpec(spec);
    }
  });
  return fields;
}

export function defaultFieldsForClass(resourceClass) {
  return defaultFieldsForSpecs(resourceClass.properties);
}

// Characters for resource ids.
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz';

export function newResourceNameForType(resourceType) {
  const newId = _.range(6).map(i => (
    ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length))
  )).join('');
  return `${resourceType}-${newId}`;
}
