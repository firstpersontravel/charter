const TextUtil = require('./text').default;

import type { Registry, ScriptContent, ParamSpec, NamedResource } from '../types';

type WalkIteree = (obj: unknown, paramSpec: ParamSpec, parent: unknown, key: string | number) => void;
type WalkAllIteree = (collectionName: string, resource: NamedResource, obj: unknown, paramSpec: ParamSpec) => void;

class Walker {
  registry: Registry;

  constructor(registry: Registry) {
    this.registry = registry;
  }

  walkParam(parent: unknown, key: string | number, obj: unknown, paramSpec: ParamSpec, paramType: string | null, iteree: WalkIteree): void {
    if (!paramSpec.type) {
      throw new Error('Param spec with no type.');
    }
    if (paramSpec.type === 'component') {
      // If we're looking for this kind of component, call the iteree, but don't
      // return, in case this component can be recursively nested inside itself.
      if (paramType === null || paramType === paramSpec.component) {
        iteree(obj, paramSpec, parent, key);
      }
      // Create the compoment class and iterate over all of its params.
      const variety = this.registry.getComponentVariety(paramSpec, obj as any);
      const varietyClass = this.registry.getComponentClass(paramSpec,
        variety);
      this.walkParams(parent, key, obj, varietyClass.properties, paramType,
        iteree);
      return;
    }
    if (paramSpec.type === 'object') {
      this.walkParams(parent, key, obj, paramSpec.properties!, paramType,
        iteree);
      return;
    }
    if (paramSpec.type === 'list') {
      if (!obj) {
        return;
      }
      (obj as unknown[]).forEach((item: unknown, i: number) => {
        this.walkParam(obj, i, item, paramSpec.items!, paramType, iteree);
      });
      return;
    }
    if (paramSpec.type === 'dictionary') {
      if (!obj) {
        return;
      }
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        this.walkParam(obj, 'keys', key, paramSpec.keys!, paramType, iteree);
        this.walkParam(obj, key, (obj as Record<string, unknown>)[key], paramSpec.values!, paramType,
          iteree);
      }
      return;
    }
    // If we've made it to here, we're a simple type. If paramType is null,
    // then we want to return all fields.
    if (paramSpec.type === paramType || paramType === null) {
      iteree(obj, paramSpec, parent, key);
    }
  }

  walkParams(parent: unknown, key: string | number, obj: unknown, spec: Record<string, ParamSpec>, paramType: string | null, iteree: WalkIteree): void {
    if (!obj) {
      return;
    }
    for (const paramName of Object.keys(spec)) {
      this.walkParam(obj, paramName, (obj as Record<string, unknown>)[paramName], spec[paramName],
        paramType, iteree);
    }
  }

  /**
   * Walk over all params in a resource.
   */
  walkResource(resourceType: string, resource: NamedResource, paramType: string | null, iteree: WalkIteree): void {
    const resourceClass = this.registry.resources[resourceType];
    if (!resourceClass) {
      return;
    }
    this.walkParams(null, null as unknown as string, resource, resourceClass.properties,
      paramType, iteree);
  }

  /**
   * Walk over all params in a resource.
   */
  walkComponent(componentType: string, component: Record<string, unknown>, paramType: string | null, iteree: WalkIteree): void {
    const variety = this.registry.getComponentVarietyByType(
      componentType, component as any);
    const varietyClass = this.registry.getComponentClassByType(componentType,
      variety);
    this.walkParams(null, null as unknown as string, component, varietyClass.properties, paramType,
      iteree);
  }

  /*
   * Walk all resources in the script to iterate over all params
   */
  walkAllFields(scriptContent: ScriptContent, paramType: string | null, iteree: WalkAllIteree): void {
    for (const collectionName of Object.keys(scriptContent)) {
      if (collectionName === 'meta') {
        continue;
      }
      const collection = scriptContent[collectionName] as NamedResource[] | undefined;
      if (!collection) {
        continue;
      }
      const resourceType = TextUtil.singularize(collectionName);
      for (const resource of collection) {
        this.walkResource(resourceType, resource, paramType,
          (obj: unknown, paramSpec: ParamSpec) => iteree(collectionName, resource, obj,
            paramSpec));
      }
    }
  }

  walkComponents(scriptContent: ScriptContent, componentType: string, iteree: WalkAllIteree): void {
    this.walkAllFields(scriptContent, componentType, iteree);
  }

  /**
   * Walk all components to get one by id.
   */
  getResourcesAndComponentsByComponentType(scriptContent: ScriptContent, componentType: string): [string, NamedResource, unknown][] {
    const components: [string, NamedResource, unknown][] = [];
    this.walkComponents(scriptContent, componentType,
      (collectionName: string, resource: NamedResource, obj: unknown, paramSpec: ParamSpec) => {
        components.push([collectionName, resource, obj]);
      });
    return components;
  }

  /**
   * Walk all components to get one by id.
   */
  getResourceAndComponentById(scriptContent: ScriptContent, componentType: string, componentId: number): [string | null, NamedResource | null, Record<string, unknown> | null] {
    let matchingCollectionName: string | null = null;
    let matchingResource: NamedResource | null = null;
    let matchingComponent: Record<string, unknown> | null = null;
    this.walkComponents(scriptContent, componentType,
      (collectionName: string, resource: NamedResource, obj: unknown, paramSpec: ParamSpec) => {
        if ((obj as Record<string, unknown>).id === componentId) {
          matchingCollectionName = collectionName;
          matchingResource = resource;
          matchingComponent = obj as Record<string, unknown>;
        }
      });
    return [matchingCollectionName, matchingResource, matchingComponent];
  }

  getComponentById(scriptContent: ScriptContent, componentType: string, componentId: number): Record<string, unknown> | null {
    return this.getResourceAndComponentById(scriptContent, componentType,
      componentId)[2];
  }

  /**
   * Walk all resources to get any referencing a specific component.
   */
  getResourcesReferencingComponent(scriptContent: ScriptContent, componentType: string, componentId: number): [string, NamedResource][] {
    const refs: [string, NamedResource][] = [];
    this.walkAllFields(scriptContent, 'componentReference',
      (collectionName: string, resource: NamedResource, obj: unknown, paramSpec: ParamSpec) => {
        if (paramSpec.componentType !== componentType) {
          return;
        }
        if (obj !== componentId) {
          return;
        }
        refs.push([collectionName, resource]);
      });
    return refs;
  }
}

export default Walker;
