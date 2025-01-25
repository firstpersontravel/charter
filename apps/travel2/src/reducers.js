import _ from 'lodash';
import update from 'immutability-helper';

export const initialState = {
  org: null,
  experience: null,
  script: null,
  trip: null
};

function readEntity(obj) {
  const keys = Object.keys(obj.attributes);
  return {
    id: obj.id,
    ...Object.fromEntries(keys.map(key => [_.camelCase(key), obj.attributes[key]]))
  };
}

function loadLegacyDataHandler(state, action) {
  console.log(action.legacyData);
  const included = action.legacyData.included;
  return update(state, {
    org: { $set: readEntity(included.find(i => i.type === 'org')) },
    experience: { $set: readEntity(included.find(i => i.type === 'experience')) },
    script: { $set: readEntity(included.find(i => i.type === 'script')) },
    trip: { $set: readEntity(action.legacyData.data) },
    profiles: { $set: included.filter(i => i.type === 'profile').map(readEntity) },
    players: { $set: included.filter(i => i.type === 'player').map(readEntity) },
    participants: { $set: included.filter(i => i.type === 'participant').map(readEntity) },
    messages: { $set: included.filter(i => i.type === 'message').map(readEntity) }
  });
}

const handlers = {
  '@@INIT': () => initialState,
  loadLegacyData: loadLegacyDataHandler
};

export default function reducer(state, action) {
  if (!handlers[action.type]) {
    throw new Error(`${action.type} unhandled`);
  }
  return handlers[action.type](state, action);
}
