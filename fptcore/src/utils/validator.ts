const Validations = require('./validations').default;
const Walker = require('./walker').default;
import { isPlainObject } from './lodash-replacements';
import type { Registry, ScriptContent, ParamSpec, ParamSpecs, ResourceClass } from '../types';

class Validator {
  registry: Registry;

  constructor(registry: Registry) {
    this.registry = registry;
  }

  dictionary(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] {
    if (!spec.keys) {
      throw new Error('Invalid dictionary spec: requires keys.');
    }
    if (!spec.values) {
      throw new Error('Invalid dictionary spec: requires values.');
    }
    if (!isPlainObject(param)) {
      return ['Dictionary param "' + name + '" should be an object.'];
    }
    const itemWarnings: string[] = [];
    const paramObj = param as Record<string, unknown>;
    Object.keys(paramObj).forEach(key => {
      const value = paramObj[key];
      // Add warnings for key
      const keyName = name + '[' + key + ']';
      itemWarnings.push.apply(itemWarnings,
        this.validateParam(scriptContent, keyName, spec.keys!, key)
      );
      // Add warnings for value
      const nestedAttribute = name + '[' + key + ']';
      itemWarnings.push.apply(itemWarnings,
        this.validateParam(scriptContent, nestedAttribute, spec.values!, value)
      );
    });
    return itemWarnings;
  }

  list(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] {
    if (!spec.items) {
      throw new Error('Invalid list spec: requires items.');
    }
    if (!Array.isArray(param)) {
      return ['List param "' + name + '" should be an array.'];
    }
    return param
      .map((item: unknown, i: number) => (
        this.validateParam(scriptContent, `${name}[${i}]`, spec.items!, item)
      ))
      .flat();
  }

  object(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] {
    if (!spec.properties) {
      throw new Error('Invalid object spec: requires properties.');
    }
    const prefix = name + '.';
    return this.validateParams(scriptContent, spec.properties, param as Record<string, unknown>, prefix);
  }

  /**
   * Embed a component validator which hinges on a key param.
   */
  component(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] {
    const componentType = spec.component!;
    const componentDef = this.registry.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component "${componentType}".`);
    }
    const variety = this.registry.getComponentVariety(spec, param as any);
    if (!variety) {
      return [`Required param "${name}[${componentDef.typeKey}]" not present.`];
    }
    const componentsRegistry = (this.registry as Record<string, unknown>)[componentType] as Record<string, unknown>;
    if (!componentsRegistry[variety]) {
      return [`"${variety}" is not one of the "${componentType}" components.`];
    }
    const componentClass = this.registry.getComponentClass(spec, variety);
    const prefix = name + '.';
    return this.validateResource(scriptContent, componentClass, param as Record<string, unknown>, prefix);
  }

  componentReference(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] | undefined {
    if (!param || !Number.isInteger(param)) {
      return [
        'Component reference param "' + name + '" ("' + param + '") ' +
        'should be an integer.'];
    }
    const walker = new Walker(this.registry);
    const component = walker.getComponentById(scriptContent,
      spec.componentType!, param as number);
    if (!component) {
      return [
        `Component reference param "${param}" should be a member of ` +
        `${spec.componentType}.`];
    }
  }

  reference(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] | undefined {
    if (spec.specialValues) {
      for (const val of spec.specialValues) {
        if (typeof val === 'string' && val === param) {
          return [];
        }
        if (typeof val === 'object' && val.value === param) {
          return [];
        }
      }
    }
    if (typeof param !== 'string') {
      return ['Reference param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!param) {
      return ['Reference attribute param "' + name + '" should not be blank.'];
    }
    if (!/[a-zA-Z]/.test(param[0])) {
      return ['Reference param "' + name + '" ("' + param + '") should start with a letter.'];
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
      return ['Reference param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
    }
    const collectionName = spec.collection!;
    const collection = (scriptContent[collectionName] || []) as Array<{ name: string }>;
    const resourceNames = collection.map(item => item.name);
    if (!resourceNames.includes(param)) {
      return ['Reference param "' + name + '" ("' + param + '") ' +
        'is not in collection "' + collectionName + '".'];
    }
  }

  /**
   * Get param type from the spec and validate a param against it.
   */
  validateParam(scriptContent: ScriptContent, name: string, spec: ParamSpec, param: unknown): string[] {
    if (!spec.type) {
      throw new Error('Missing param type in spec "' + name + '".');
    }
    if (Validations[spec.type]) {
      const validator = Validations[spec.type];
      return validator.validate(scriptContent, name, spec, param) || [];
    }
    if ((this as any)[spec.type]) {
      const validator = (this as any)[spec.type];
      return validator.call(this, scriptContent, name, spec, param) || [];
    }
    throw new Error('Invalid param type "' + spec.type + '".');
  }

  /**
   * Validate an entry in a params object.
   */
  validateParamEntry(scriptContent: ScriptContent, paramSpec: ParamSpec, param: unknown, paramNameWithPrefix: string): string[] {
    if (!paramSpec) {
      throw new Error(`Empty param spec for param "${paramNameWithPrefix}".`);
    }

    if (param === undefined) {
      // Required params must be present.
      if (paramSpec.required) {
        return ['Required param "' + paramNameWithPrefix + '" not present.'];
      }
      // Otherwise skip validation on empty entries.
      return [];
    }

    return this.validateParam(scriptContent, paramNameWithPrefix, paramSpec,
      param);
  }

  /**
   * Validate a list of params against a spec.
   */
  validateParams(scriptContent: ScriptContent, paramsSpec: ParamSpecs, params: Record<string, unknown>, prefix: string): string[] {
    const warnings: string[] = [];

    // If you only have a 'self' parameter, then apply the parameter checking
    // passing through the object. Otherwise require an object and do parameter
    // checking on each key/value pair.
    if (!isPlainObject(params)) {
      return ['Parameters should be an object.'];
    }

    // Check for required params and do individual parameter validation.
    for (const paramName of Object.keys(paramsSpec)) {
      const paramSpec = paramsSpec[paramName];
      const param = params[paramName];
      const paramNameWithPrefix = prefix + paramName;
      warnings.push(...this.validateParamEntry(scriptContent, paramSpec,
        param, paramNameWithPrefix));
    }

    // Check for unexpected params -- events sometimes have string paramss,
    // like in `{ event: { cue: CUE-NAME } }`.
    for (const paramName of Object.keys(params)) {
      const paramNameWithPrefix = prefix + paramName;
      if (!paramsSpec[paramName]) {
        warnings.push(
          'Unexpected param "' + paramNameWithPrefix +
          '" (expected one of: ' + Object.keys(paramsSpec).join(', ') + ').'
        );
      }
    }

    // Return gathered warnings
    return warnings;
  }

  /**
   * Validate a whole resource definition.
   */
  validateResource(scriptContent: ScriptContent, resourceClass: ResourceClass, resource: Record<string, unknown>, prefix?: string): string[] {
    if (!resourceClass.properties) {
      throw new Error('Invalid resource: expected properties.');
    }
    const warnings = this.validateParams(scriptContent,
      resourceClass.properties, resource, prefix || '');
    if (resourceClass.validateResource) {
      const resourceWarnings = resourceClass.validateResource(scriptContent,
        resource as any);
      if (resourceWarnings) {
        warnings.push(...resourceWarnings);
      }
    }
    return warnings;
  }
}

export default Validator;
