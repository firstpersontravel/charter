import config from './config';


function loadLegacyData(legacyData) {
  return {
    type: 'loadLegacyData',
    legacyData: legacyData
  };
}

function refreshLegacyData(legacyData) {
  return {
    type: 'refreshLegacyData',
    legacyData: legacyData
  };
}

function setGlobalError(err) {
  return {
    type: 'setGlobalError',
    err: err
  };
}

function fetchData(url, args) {
  return fetch(url, args)
    .catch((err) => {
      throw new Error('Failed to load data.');
    })
    .then((response) => {
      if (!response || !response.ok) {
        throw new Error('Failed to load data.');
      }
      return response.json();
    });
}

function getData(url) {
  const args = {
    method: 'get',
    headers: {
      Authorization: `Bearer ${config.authToken}`
    }
  };
  return fetchData(url, args);
}

function postData(url, params) {
  const args = {
    method: 'post',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.authToken}`
    }
  };
  return fetchData(url, args);
}

export function loadData(tripId, playerId) {
  return function (dispatch) {
    getData(`/api/legacy/trip/${tripId}?script=1`)
      .then((legacyData) => {
        dispatch(loadLegacyData(legacyData));
      })
      .catch((err) => {
        dispatch(setGlobalError(err));
      });
  };
}

function refresh(tripId, dispatch) {
  return getData(`/api/legacy/trip/${tripId}`)
    .then((legacyData) => {
      dispatch(refreshLegacyData(legacyData));
    })
    .catch((err) => {
      dispatch(setGlobalError(err));
    });
}

export function refreshData(tripId, playerId) {
  return function (dispatch) {
    return refresh(tripId, dispatch);
  };
}

export function postAction(tripId, playerId, actionName, actionParams) {
  return function (dispatch) {
    const params = {
      client_id: config.clientId,
      player_id: playerId,
      name: actionName,
      params: actionParams
    };
    postData(`/api/trips/${tripId}/actions`, params)
      .catch((err) => {
        dispatch(setGlobalError(err));
      })
      .then(() => refresh(tripId, dispatch));
  };
}

export function fireEvent(tripId, playerId, event) {
  return function (dispatch) {
    const params = Object.assign({}, event, {
      client_id: config.clientId,
      player_id: playerId
    });
    postData(`/api/trips/${tripId}/events`, params)
      .catch((err) => {
        dispatch(setGlobalError(err));
      })
      .then(() => refresh(tripId, dispatch));
  };
}

export function receiveMessage(tripId, msg) {
  return function (dispatch) {
    return refresh(tripId, dispatch);
  };
}

export function updateLocation(tripId, participantId, lat, lng, accuracy, timestamp) {
  return function (dispatch) {
    const params = {
      location_latitude: lat,
      location_longitude: lng,
      location_accuracy: accuracy,
      location_timestamp: timestamp
    };
    postData(`/api/trips/${tripId}/device_state/${participantId}`, params)
      .catch((err) => {
        dispatch(setGlobalError(err));
      })
      .then(() => refresh(tripId, dispatch));
  };
}
