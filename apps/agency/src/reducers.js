import _ from 'lodash';
import update from 'immutability-helper';

export const initialState = {
  globalError: null,
  requests: {},
  requestErrors: {},
  revisionHistory: {},
  datastore: {
    auth: [],
    orgs: [],
    assets: [],
    experiences: [],
    scripts: [],
    groups: [],
    profiles: [],
    trips: [],
    participants: [],
    players: [],
    messages: [],
    relays: [],
    relayEntryways: [],
    relayServices: [],
    actions: []
  }
};

function resetHandler(state, action) {
  return Object.assign({}, initialState, {
    // preserve requests
    requests: Object.assign({}, state.requests, {
      'auth.login': null
    })
  });
}

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

function updateInstanceFieldsHandler(state, action) {
  const collection = state.datastore[action.collectionName];
  const index = _.findIndex(collection, { id: action.instanceId });
  if (index === -1) {
    console.warn(
      `Tried to update nonexistent ${action.collectionName} ` +
      `with id ${action.instanceId}`);
    return state;
  }
  const instance = collection[index];
  const instanceUpdate = _.mapValues(action.fields, (field, key) => ({
    // Merge object, everything else gets set directly.
    $set: (typeof field === 'object' ? Object.assign({}, instance[key], field) : field)
  }));
  const collectionUpdate = { [index]: instanceUpdate };
  return update(state, {
    datastore: { [action.collectionName]: collectionUpdate }
  });
}

function clearInstancesHandler(state, action) {
  return update(state, {
    datastore: { [action.collectionName]: { $set: [] } }
  });
}

function updateRevisionHistoryHandler(state, action) {
  const maxRevisions = 100;
  // If we're saving our first revision history update, save both the old
  // content and the new, so we can undo and redo as many times as we want
  const existing = state.revisionHistory[action.recordName]
    || [action.oldContent];
  // Add the new content all the time.
  const updated = existing.concat([action.newContent]);
  const trimmed = updated.slice(updated.length - maxRevisions);
  // Replace the revision history object entirely -- we only save one
  // script's history at a time.
  return update(state, {
    revisionHistory: {
      $set: {
        lastUpdated: new Date().valueOf(),
        [action.recordName]: trimmed
      }
    }
  });
}

function setGlobalErrorHandler(state, action) {
  return update(state, {
    globalError: { $set: action.err }
  });
}

const handlers = {
  reset: resetHandler,
  saveInstances: saveInstancesHandler,
  clearInstances: clearInstancesHandler,
  updateInstanceFields: updateInstanceFieldsHandler,
  saveRequest: saveRequestHandler,
  updateRevisionHistory: updateRevisionHistoryHandler,
  setGlobalError: setGlobalErrorHandler
};

export default function reducer(state, action) {
  if (!handlers[action.type]) {
    return state;
  }
  return handlers[action.type](state, action);
}
