import config from './config';

function loadLegacyData(legacyData) {
  return {
    type: 'loadLegacyData',
    legacyData: legacyData
  };
}

function fetchData(url) {
  return fetch(url)
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

export function refreshData(tripId, playerId) {
  return function (dispatch) {
    fetchData(`${config.serverUrl}/api/legacy/trip/${tripId}?script=1`)
      .then((legacyData) => {
        dispatch(loadLegacyData(legacyData));
      });
  };
}
