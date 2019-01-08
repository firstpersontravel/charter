import _ from 'lodash';

export function latestAuthData(state) {
  return _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
}

function getInstances(state, collectionName, filters) {
  const collection = state.datastore[collectionName];
  const instances = _.filter(collection, filters);
  const reqList = state.requests[`${collectionName}.list`];
  const isLoading = reqList === 'pending';
  const isError = reqList === 'rejected';
  return Object.assign(instances, {
    isNull: false,
    isLoading: isLoading,
    isError: isError
  });
}

function getInstance(state, collectionName, finders) {
  const collection = state.datastore[collectionName];
  const instance = _.find(collection, finders);
  const reqList = state.requests[`${collectionName}.list`];
  const isLoading = reqList === 'pending';
  const isError = reqList === 'rejected';
  return Object.assign({}, instance, {
    isNull: false,
    isLoading: isLoading,
    isError: isError
  });
}

export function instanceIncluder(collectionName, relField, selfField) {
  return (state, instance) => {
    const selfValue = instance[selfField];
    if (!selfValue) {
      return { isNull: true, isLoading: false, isError: false };
    }
    const finders = { [relField]: selfValue };
    return getInstance(state, collectionName, finders);
  };
}

function addIncluders(state, instance, includers) {
  const includedValues = _.mapValues(includers, (includer, key) => (
    includer(state, instance)
  ));
  const isLoading = instance.isLoading || _.some(includedValues, 'isLoading');
  const isError = instance.isError || _.some(includedValues, 'isError');
  return Object.assign({}, instance, includedValues, {
    isLoading: isLoading,
    isError: isError
  });
}

export function instancesFromDatastore(state, instancesSpec) {
  const col = instancesSpec.col;
  if (!col) {
    throw new Error('Expected collection.');
  }
  const filters = instancesSpec.filter || {};
  const prefilters = _.pickBy(filters, (v, k) => !_.isPlainObject(v));
  const includers = instancesSpec.include || {};
  const instances = getInstances(state, col, prefilters);
  const instancesWithIncludes = _.map(instances, instance => (
    addIncluders(state, instance, includers)
  ));
  const filtered = _.filter(instancesWithIncludes, filters);
  const isLoading = instances.isLoading ||
    _.some(instancesWithIncludes, 'isLoading');
  const isError = instances.isError ||
    _.some(instancesWithIncludes, 'isError');
  return Object.assign(filtered, {
    isLoading: isLoading,
    isError: isError
  });
}

export function instanceFromDatastore(state, instancesSpec) {
  const instances = instancesFromDatastore(state, instancesSpec);
  if (!instances.length) {
    return {
      isNull: true,
      isLoading: instances.isLoading,
      isError: instances.isError
    };
  }
  return Object.assign({}, instances[0], {
    isNull: false,
    isLoading: instances.isLoading,
    isError: instances.isError
  });
}
