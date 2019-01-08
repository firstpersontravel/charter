import _ from 'lodash';

export function latestAuthData(state) {
  return _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
}

function instanceFromInstances(instances) {
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

function getInstances(state, colName, filters) {
  const collection = state.datastore[colName];
  const instances = _.filter(collection, filters);
  const reqList = state.requests[`${colName}.list`];
  const isLoading = reqList === 'pending';
  const isError = reqList === 'rejected';
  return Object.assign(instances, {
    isLoading: isLoading,
    isError: isError
  });
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

function getInstancesWithIncludes(state, colName, filters, includers) {
  const prefilters = _.pickBy(filters, (v, k) => !_.isPlainObject(v));
  const instances = getInstances(state, colName, prefilters);
  const withIncludes = _.map(instances, instance => (
    addIncluders(state, instance, includers)
  ));
  const filtered = _.filter(withIncludes, filters);
  const isLoading = instances.isLoading || _.some(withIncludes, 'isLoading');
  const isError = instances.isError || _.some(withIncludes, 'isError');
  return Object.assign(filtered, {
    isLoading: isLoading,
    isError: isError
  });
}

export function instanceIncluder(colName, relField, selfField, includes) {
  return (state, instance) => {
    const selfValue = instance[selfField];
    if (!selfValue) {
      return { isNull: true, isLoading: false, isError: false };
    }
    const filters = { [relField]: selfValue };
    return instanceFromInstances(getInstancesWithIncludes(state, colName,
      filters, includes));
  };
}

export function instancesIncluder(colName, relField, selfField, filters,
  includes) {
  return (state, instance) => {
    const selfValue = instance[selfField];
    const lookup = { [relField]: selfValue };
    const filtersWithLookup = Object.assign(lookup, filters);
    return getInstancesWithIncludes(state, colName, filtersWithLookup,
      includes);
  };
}

export function instancesFromDatastore(state, instancesSpec) {
  return getInstancesWithIncludes(state, instancesSpec.col,
    instancesSpec.filter, instancesSpec.include);
}

export function instanceFromDatastore(state, instancesSpec) {
  return instanceFromInstances(instancesFromDatastore(state, instancesSpec));
}
