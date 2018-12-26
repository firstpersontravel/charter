import _ from 'lodash';
import update from 'immutability-helper';

const initialState = {
  requests: {},
  requestErrors: {},
  datastore: {
    scripts: [],
    groups: [],
    profiles: [],
    trips: [],
    users: [],
    participants: [],
    messages: [],
    relays: [],
    actions: []
  }
};

function saveRequestHandler(state, action) {
  const updates = {
    requests: { [action.operationName]: { $set: action.status } }
  };
  if (action.error) {
    updates.requestErrors = {
      [action.operationName]: { $set: action.error }
    };
  }
  return update(state, updates);
}

function saveInstancesHandler(state, action) {
  const collection = state.datastore[action.collectionName];
  const collectionUpdate = {};
  _.each(action.instances, (instance) => {
    const index = _.findIndex(collection, { id: instance.id });
    if (index > -1) {
      collectionUpdate[index] = { $set: instance };
    } else {
      if (!collectionUpdate.$push) {
        collectionUpdate.$push = [];
      }
      collectionUpdate.$push.push(instance);
    }
  });
  return update(state, {
    datastore: { [action.collectionName]: collectionUpdate }
  });
}

function clearInstancesHandler(state, action) {
  return update(state, {
    datastore: { [action.collectionName]: { $set: [] } }
  });
}

const handlers = {
  saveInstances: saveInstancesHandler,
  clearInstances: clearInstancesHandler,
  saveRequest: saveRequestHandler
};

export default function reducer(state = initialState, action) {
  if (!handlers[action.type]) {
    return state;
  }
  return handlers[action.type](state, action);
}
