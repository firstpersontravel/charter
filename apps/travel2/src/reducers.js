import update from 'immutability-helper';

export const initialState = {};

function doNothingHandler(state, action) {
  return update(state, {});
}

const handlers = {
  doNothing: doNothingHandler
};

export default function reducer(state, action) {
  if (!handlers[action.type]) {
    return state;
  }
  return handlers[action.type](state, action);
}
