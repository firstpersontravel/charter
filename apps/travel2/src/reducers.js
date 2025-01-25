import _ from 'lodash';
import update from 'immutability-helper';

export const initialState = {
  org: null,
  experience: null,
  script: null,
  trip: null,
  profiles: null,
  players: null,
  participants: null,
  messages: null
};

function readEntity(obj) {
  const attrKeys = Object.keys(obj.attributes);
  const relationshipKeys = Object.keys(obj.relationships)
    .filter(key => !!obj.relationships[key].data);
  const relationships = Object.fromEntries(relationshipKeys
    .map(key => [`${key}Id`, obj.relationships[key].data.id]));
  return {
    id: obj.id,
    ...relationships,
    ...Object.fromEntries(attrKeys.map(key => [_.camelCase(key), obj.attributes[key]]))
  };
}

function loadLegacyDataHandler(state, action) {
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
