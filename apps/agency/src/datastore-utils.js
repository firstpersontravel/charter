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
  const withInclude = _.clone(instance);
  // Apply includers in turn, since later ones may depend on earlier ones.
  _.each(includers, (includer, key) => {
    withInclude[key] = includer(state, withInclude);
    if (!withInclude[key]) {
      return;
    }
    if (withInclude[key].isLoading) {
      withInclude.isLoading = true;
    }
    if (withInclude[key].isError) {
      withInclude.isError = true;
    }
  });
  return withInclude;
}

function getInstancesWithIncludes(state, spec) {
  // Can invoke either with a spec or with positional args.
  const colName = spec.col;
  const filters = spec.filter;
  const sort = spec.sort || 'id';
  const limit = spec.limit || null;
  const includers = spec.include;

  const selfFilter = filters.self || (() => true);
  const propFilters = _.omit(filters, 'self');
  const prefilters = _.pickBy(propFilters, (v, k) => !_.isPlainObject(v));
  const instances = getInstances(state, colName, prefilters);
  const withIncludes = _.map(instances, instance => (
    addIncluders(state, instance, includers)
  ));
  const filtered = _(withIncludes)
    .filter(propFilters)
    .filter(selfFilter)
    .sortBy(_.isArray(sort) ? [sort] : sort)
    .value();
  const limited = limit ? filtered.slice(0, limit) : filtered;
  const isLoading = instances.isLoading || _.some(withIncludes, 'isLoading');
  const isError = instances.isError || _.some(withIncludes, 'isError');
  return Object.assign(limited, {
    isLoading: isLoading,
    isError: isError
  });
}

const warnings = {};

function warnNotFound(state, colName, relField, selfValue) {
  const listState = state.requests[`${colName}.list`];
  if (listState === 'pending') {
    // No warning -- pending
    // console.info(`Awaiting ${colName} where ${relField} = ${selfValue}.`);
    return;
  } else if (listState === 'rejected') {
    // No warning -- error should be shown else where
    // console.error(`Error loading ${colName} where ${relField} = ${selfValue}.`);
    return;
  }
  const warningKey = `${colName}-${relField}-${selfValue}`;
  if (warnings[warningKey]) {
    return;
  }
  warnings[warningKey] = true;
  console.warn(`Could not find ${colName} where ${relField} = ${selfValue}.`);
}

export function instanceIncluder(colName, relField, selfField, includes) {
  return (state, instance) => {
    const selfValue = instance[selfField];
    if (!selfValue) {
      console.warn(`Null ${selfField} value on ${colName} id ${instance.id}.`);
      return { isNull: true, isLoading: false, isError: false };
    }
    const filters = { [relField]: selfValue };
    const foundInstances = getInstancesWithIncludes(state, {
      col: colName,
      filter: filters,
      include: includes
    });
    const foundInstance = instanceFromInstances(foundInstances);
    if (foundInstance.isNull) {
      warnNotFound(state, colName, relField, selfValue);
    }
    return foundInstance;
  };
}

export function instancesIncluder(colName, relField, selfField, filters,
  includes) {
  return (state, instance) => {
    const selfValue = instance[selfField];
    const lookup = { [relField]: selfValue };
    const filtersWithLookup = Object.assign(lookup, filters);
    return getInstancesWithIncludes(state, {
      col: colName,
      filter: filtersWithLookup,
      include: includes
    });
  };
}

export function instancesFromDatastore(state, instancesSpec) {
  return getInstancesWithIncludes(state, instancesSpec);
}

export function instanceFromDatastore(state, instancesSpec) {
  return instanceFromInstances(instancesFromDatastore(state, instancesSpec));
}
