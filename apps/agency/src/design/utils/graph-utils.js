import _ from 'lodash';

import {
  ResourcesRegistry,
  TextUtil
} from 'fptcore';

const walkers = {
  reference: (spec, value, iteree) => {
    iteree(spec.collection, value);
  },
  params: (spec, value, iteree) => {
    _.each(spec, (paramSpec, key) => {
      if (walkers[paramSpec.type]) {
        walkers[paramSpec.type](paramSpec, value[key], iteree);
      }
    });
  },
  list: (spec, value, iteree) => {
    _.each(value, (item) => {
      if (walkers[spec.items.type]) {
        walkers[spec.items.type](spec.items, item, iteree);
      }
    });
  },
  dictionary: (spec, value, iteree) => {
    _.each(value, (val, key) => {
      if (walkers[spec.keys.type]) {
        walkers[spec.keys.type](spec.keys, key, iteree);
      }
      if (walkers[spec.values.type]) {
        walkers[spec.values.type](spec.values, val, iteree);
      }
    });
  },
  object: (spec, value, iteree) => {
    _.each(spec.properties, (propSpec, key) => {
      if (walkers[propSpec.type]) {
        const propValue = value && value[key];
        walkers[propSpec.type](propSpec, propValue, iteree);
      }
    });
  },
  component: (spec, value, iteree) => {
    const variety = _.isFunction(spec.key) ? spec.key(value) : value[spec.key];
    const commonClass = spec.common;
    const varietyClass = spec.classes[variety];
    const mergedClass = _.merge({}, commonClass, varietyClass);
    walkers.object(mergedClass, value, iteree);
  }
};

function walkReferences(collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  if (!resourceClass) {
    return [];
  }
  const references = [];
  walkers.params(resourceClass.properties, resource, (c, r) => {
    references.push(`${c}.${r}`);
  });
  return references;
}

export function assembleReverseReferences(scriptContent) {
  const graph = {};
  _.each(scriptContent, (collection, collectionName) => {
    if (collectionName === 'meta') {
      return;
    }
    _.each(collection, (resource) => {
      const resourceStr = `${collectionName}.${resource.name}`;
      const resourceRefs = walkReferences(collectionName, resource);
      _.each(resourceRefs, (ref) => {
        if (!graph[ref]) {
          graph[ref] = [];
        }
        if (graph[ref].indexOf(resourceStr) === -1) {
          graph[ref].push(resourceStr);
        }
      });
    });
  });
  return graph;
}

export function getChildResourceTypes(collectionName) {
  return _(ResourcesRegistry)
    .keys()
    .filter(childResourceType => (
      _.some(ResourcesRegistry[childResourceType].properties, property => (
        property.type === 'reference' &&
        property.collection === collectionName &&
        property.parent
      ))
    ))
    .value();
}
