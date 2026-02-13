import { omit, merge } from '../utils/lodash-replacements';
import type {
  ModuleDef, ComponentDefs, ResourceClass, ParamSpec, ComponentValue
} from '../types';

class Registry {
  modules: Record<string, ModuleDef>;
  resources: Record<string, ResourceClass>;
  components: ComponentDefs;
  _cache: Record<string, ResourceClass>;
  [key: string]: unknown;

  constructor(modules: ModuleDef[], components: ComponentDefs) {
    this.modules = {};
    this.resources = {};
    this.components = components;
    this._cache = {};

    for (const componentType of Object.keys(components)) {
      this[componentType] = {};
    }

    // Load modules
    for (const mod of modules) {
      for (const componentType of Object.keys(components)) {
        (mod as any)[componentType] = {};
      }
      for (const resourceType of Object.keys(mod.resources || {})) {
        const resourceDef = mod.resources![resourceType];
        for (const componentType of Object.keys(components)) {
          Object.assign(
            (mod as any)[componentType],
            (resourceDef as any)[componentType]
          );
          Object.assign(
            this[componentType] as object,
            (resourceDef as any)[componentType]
          );
        }
        if (resourceDef.resource) {
          this.resources[resourceType] = resourceDef.resource;
        }
      }
      this.modules[mod.name] = mod;
    }
  }

  getComponentVarietyByType(componentType: string, value: ComponentValue | null): string | null {
    const componentDef = this.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component type "${componentType}".`);
    }
    return value ? value[componentDef.typeKey] as string : null;
  }

  getComponentVariety(spec: ParamSpec, value: ComponentValue | null): string | null {
    const componentType = spec.component!;
    return this.getComponentVarietyByType(componentType, value);
  }

  /**
   * Get resource class of a component property, merging common and variety.
   */
  getComponentClassByType(componentType: string, variety: string | null): ResourceClass {
    const cacheKey = `${componentType}-${variety}`;
    if (this._cache[cacheKey]) {
      return this._cache[cacheKey];
    }
    const componentDef = this.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component type "${componentType}".`);
    }
    const componentsRegistry = this[componentType] as Record<string, Record<string, unknown>>;
    const typeClass: ResourceClass = {
      properties: {
        [componentDef.typeKey]: {
          type: 'enum',
          options: Object.keys(componentsRegistry),
          required: true,
          help: `Type of ${componentType}.`,
          display: { label: false }
        }
      }
    };
    // Return type object if no existing component to allow you to choose one
    // in the interface.
    if (!variety || !componentsRegistry[variety]) {
      return Object.assign({ display: { form: 'inline' } }, typeClass);
    }

    const commonClass = componentDef.common || {};
    // For component class, rename `params` / `specParams` to `properties`.
    // TODO: all components should just use `properties` as a name.
    const varietyClass = Object.assign({
      properties: componentsRegistry[variety][componentDef.propertiesKey]
    }, omit(componentsRegistry[variety], componentDef.propertiesKey));
    const componentClass = this._cache[cacheKey] = merge({}, typeClass, commonClass, varietyClass);
    return componentClass;
  }

  getComponentClass(spec: ParamSpec, variety: string | null): ResourceClass {
    const componentType = spec.component!;
    return this.getComponentClassByType(componentType, variety);
  }
}

export default Registry;
