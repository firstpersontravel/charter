import _ from 'lodash';

import { TextUtil, coreRegistry, coreWalker } from 'fptcore';

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

function newComponentId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

const componentTypesWithId = ['panels', 'actions'];

export function getNewComponent(componentType, variant) {
  const componentClass = coreRegistry.components[componentType];
  const componentTypeKey = componentClass.typeKey;
  const variantClass = coreRegistry.getComponentClassByType(componentType,
    variant);
  const defaults = defaultFieldsForSpecs(variantClass.properties);
  const fields = Object.assign(defaults, { [componentTypeKey]: variant });
  if (componentTypesWithId.includes(componentType)) {
    fields.id = newComponentId();
  }
  return fields;
}

export function getComponentOptions(componentType) {
  return [{ value: '', label: '---' }].concat(Object
    .keys(coreRegistry[componentType])
    .map(key => ({ value: key, label: TextUtil.titleForKey(key) })))
    .sort((a, b) => (a.label > b.label ? 1 : -1));
}

export function duplicateComponent(componentType, existingComponent) {
  const clonedComponent = _.cloneDeep(existingComponent);
  const newComponent = Object.assign({}, clonedComponent, {
    id: newComponentId()
  });

  // Generate new panel/action IDs by random number. Hacky!
  // eslint-disable-next-line no-restricted-syntax
  for (const subtype of componentTypesWithId) {
    coreWalker.walkComponent(componentType, newComponent, subtype, (obj) => {
      // eslint-disable-next-line no-param-reassign
      obj.id = newComponentId();
    });
  }

  return newComponent;
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

export function getNewResourceFields(collectionName, defaults) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceType];
  const newName = newResourceNameForType(resourceType);
  const defaultFields = defaultFieldsForClass(resourceClass);
  const fields = Object.assign({ name: newName }, defaultFields);

  if (resourceClass.properties.title) {
    fields.title = `New ${resourceType}`;
  }

  _.each(defaults, (val, key) => {
    if (resourceClass.properties[key]) {
      fields[key] = val;
    }
  });

  return fields;
}

export function duplicateResource(collectionName, existingResource) {
  const resType = TextUtil.singularize(collectionName);
  const newName = newResourceNameForType(resType);
  const clonedResource = _.cloneDeep(existingResource);
  const newResource = Object.assign({}, clonedResource, { name: newName });

  // Generate new panel/action IDs by random number. Hacky!
  // eslint-disable-next-line no-restricted-syntax
  for (const componentType of componentTypesWithId) {
    coreWalker.walkResource(resType, newResource, componentType, (obj) => {
      // eslint-disable-next-line no-param-reassign
      obj.id = newComponentId();
    });
  }

  return newResource;
}
