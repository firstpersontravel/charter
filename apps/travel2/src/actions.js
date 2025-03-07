import config from './config';

import moment from 'moment';

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

function fetchData(url, args) {
  return fetch(url, args)
    .catch((err) => {
      console.error('error');
    })
    .then((response) => {
      if (!response.ok) {
        console.error('error');
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
    getData(`${config.serverUrl}/api/legacy/trip/${tripId}?script=1`)
      .then((legacyData) => {
        dispatch(loadLegacyData(legacyData));
      });
  };
}

function refresh(tripId, dispatch) {
  return getData(`${config.serverUrl}/api/legacy/trip/${tripId}`)
    .then((legacyData) => {
      dispatch(refreshLegacyData(legacyData));
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
    postData(`${config.serverUrl}/api/trips/${tripId}/actions`, params)
      .then(() => refresh(tripId, dispatch));
  };
}

export function fireEvent(tripId, playerId, event) {
  return function (dispatch) {
    const params = Object.assign({}, event, {
      client_id: config.clientId,
      player_id: playerId
    });
    postData(`${config.serverUrl}/api/trips/${tripId}/events`, params)
      .then(() => refresh(tripId, dispatch));
  };
}

export function receiveMessage(tripId, msg) {
  return function (dispatch) {
    return refresh(tripId, dispatch);
  };
}

export function updateLocation(tripId, participantId, lat, lng) {
  return function (dispatch) {
    const params = {
      location_latitude: lat,
      location_longitude: lng,
      location_accuracy: 30,
      location_timestamp: Math.floor(moment.utc().valueOf() / 1000)
    };
    postData(`${config.serverUrl}/api/trips/${tripId}/device_state/${participantId}`, params)
      .then(() => refresh(tripId, dispatch));
  };
}
