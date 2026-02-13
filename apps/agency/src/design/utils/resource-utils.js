import _ from 'lodash';

const FptCore = require('fptcore').default;

import { titleForResourceType } from './text-utils';

export function doesSpecHaveDefault(spec) {
  if (spec.default !== undefined) {
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
  const componentClass = FptCore.coreRegistry.components[componentType];
  const componentTypeKey = componentClass.typeKey;
  const variantClass = FptCore.coreRegistry.getComponentClassByType(componentType,
    variant);
  const defaults = defaultFieldsForSpecs(variantClass.properties);
  const fields = Object.assign(defaults, { [componentTypeKey]: variant });
  if (componentTypesWithId.includes(componentType)) {
    fields.id = newComponentId();
  }
  return fields;
}

export function getComponentVariantOptions(componentType) {
  const componentRegistry = FptCore.coreRegistry[componentType];
  return [{ value: '', label: '---' }].concat(Object
    .keys(componentRegistry)
    .map(key => ({
      value: key,
      label: componentRegistry[key].title || FptCore.TextUtil.titleForKey(key)
    })))
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
    FptCore.coreWalker.walkComponent(componentType, newComponent, subtype, (obj) => {
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

export function duplicateResource(collectionName, existingResource) {
  const resType = FptCore.TextUtil.singularize(collectionName);
  const newName = newResourceNameForType(resType);
  const clonedResource = _.cloneDeep(existingResource);
  const newResource = Object.assign({}, clonedResource, { name: newName });

  // Generate new panel/action IDs by random number. Hacky!
  // eslint-disable-next-line no-restricted-syntax
  for (const componentType of componentTypesWithId) {
    FptCore.coreWalker.walkResource(resType, newResource, componentType, (obj) => {
      // eslint-disable-next-line no-param-reassign
      obj.id = newComponentId();
    });
  }

  return newResource;
}


export function createNewResource(collectionName, defaults) {
  const resourceType = FptCore.TextUtil.singularize(collectionName);
  const resourceClass = FptCore.coreRegistry.resources[resourceType];
  const defaultFields = defaultFieldsForClass(resourceClass);

  if (resourceClass.properties.title) {
    const resourceTypeTitle = titleForResourceType(resourceType).toLowerCase();
    defaultFields.title = `New ${resourceTypeTitle}`;
  }

  _.each(defaults, (val, key) => {
    if (resourceClass.properties[key]) {
      defaultFields[key] = val;
    }
  });

  // Duplicate resource to add panel and action IDs if needed, and name
  return duplicateResource(collectionName, defaultFields);
}
