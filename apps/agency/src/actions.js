import _ from 'lodash';
import 'whatwg-fetch';

import { getStage } from './utils';

function saveRequest(operationName, status, error) {
  return {
    type: 'saveRequest',
    operationName: operationName,
    status: status,
    error: error
  };
}

function saveInstances(collectionName, instances) {
  if (!instances) {
    throw new Error('saveInstances requires instances');
  }
  return {
    type: 'saveInstances',
    collectionName: collectionName,
    instances: instances
  };
}

function clearInstances(collectionName) {
  return {
    type: 'clearInstances',
    collectionName: collectionName
  };
}

function modelNameForCollectionName(collectionName) {
  return collectionName.substring(0, collectionName.length - 1);
}

function fetchJsonAssuringSuccess(url, params) {
  return fetch(url, params)
    .then((response) => {
      if (response.status >= 400) {
        const failedRequest = new Error(`Failed request to ${url}`);
        failedRequest.status = response.status;
        return response.json()
          .then((data) => {
            failedRequest.data = data;
          })
          .catch(() => {
            // Catch bad JSON errors
            failedRequest.data = {
              message: {
                502: 'Gateway error',
                500: 'Internal error'
              }[response.status] || `Error requesting ${url}`
            };
          })
          .then(() => {
            throw failedRequest;
          });
      }
      return response.json();
    });
}

function request(collectionName, instanceId, operationName, url, params,
  dispatch) {
  const requestName = instanceId ?
    `${collectionName}.${instanceId}.${operationName}` :
    `${collectionName}.${operationName}`;
  dispatch(saveRequest(requestName, 'pending', null));
  return fetchJsonAssuringSuccess(url, params)
    .then((data) => {
      dispatch(saveRequest(requestName, 'fulfilled', null));
      return data;
    })
    .catch((err) => {
      const errdata = { data: err.data || null, status: err.status || null };
      dispatch(saveRequest(requestName, 'rejected', errdata));
      throw err;
    });
}

function createQueryString(query) {
  const queryArray = [];
  _.each(query || [], (v, k) => {
    if (_.isArray(v)) {
      _.each(v, i => queryArray.push([k, i]));
    } else {
      queryArray.push([k, v]);
    }
  });
  const queryParts = _.map(queryArray, arr => `${arr[0]}=${arr[1]}`);
  if (!queryParts) {
    return '';
  }
  return `?${_.join(queryParts, '&')}`;
}

export function listCollection(collectionName, query, opts) {
  return function (dispatch) {
    const queryString = createQueryString(query);
    const url = `/api/${collectionName}${queryString}`;
    const params = { method: 'GET' };
    return request(collectionName, null, 'list', url, params, dispatch)
      .then((response) => {
        if (opts && opts.clear) {
          dispatch(clearInstances(collectionName));
        }
        dispatch(saveInstances(collectionName, response.data[collectionName]));
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function getInstance(collectionName, instanceId) {
  if (!instanceId) {
    throw new Error('instanceId required to getInstance');
  }
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    const url = `/api/${collectionName}/${instanceId}`;
    const params = { method: 'GET' };
    return request(collectionName, instanceId, 'get', url, params, dispatch)
      .then((response) => {
        dispatch(saveInstances(collectionName, [response.data[modelName]]));
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function createInstance(collectionName, fields) {
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    const url = `/api/${collectionName}`;
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    };
    return request(collectionName, null, 'create', url, params, dispatch)
      .then((response) => {
        dispatch(saveInstances(collectionName, [response.data[modelName]]));
        return response.data[modelName];
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function updateInstance(collectionName, instanceId, fields) {
  if (!instanceId) {
    throw new Error('instanceId required to updateInstance');
  }
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    const url = `/api/${collectionName}/${instanceId}`;
    const params = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    };
    return request(collectionName, instanceId, 'update', url, params, dispatch)
      .then((response) => {
        dispatch(saveInstances(collectionName, [response.data[modelName]]));
        return response.data[modelName];
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function refreshLiveData(tripIds) {
  return function (dispatch) {
    dispatch(listCollection('users', { isArchived: false }));
    dispatch(listCollection('trips', { id: tripIds }));
    dispatch(listCollection('players',
      { tripId: tripIds }));
    dispatch(listCollection('actions',
      { tripId: tripIds, appliedAt: 'null' },
      { clear: true }));
    dispatch(listCollection('messages',
      { tripId: tripIds,
        sort: '-id',
        count: 100
      }));
  };
}

export function postAction(tripId, actionName, actionParams) {
  return function (dispatch) {
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: actionName, params: actionParams })
    };
    const url = `/api/trips/${tripId}/actions`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(refreshLiveData([tripId]));
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function postAdminAction(tripId, actionName, actionParams,
  shouldRefresh = true) {
  return function (dispatch) {
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionParams || {})
    };
    const url = `/api/admin/trips/${tripId}/${actionName}`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        if (shouldRefresh === true) {
          dispatch(refreshLiveData([tripId]));
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function updateRelays(scriptName) {
  return function (dispatch) {
    const params = { method: 'POST' };
    const url = `/api/admin/scripts/${scriptName}/update_relays`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(listCollection('relays', { stage: getStage() }));
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}

export function initializeTrip(fields, playersFields) {
  return function (dispatch) {
    createInstance('trips', fields)(dispatch)
      .then((data) => {
        const tripId = data.id;
        playersFields.forEach((playerFields) => {
          const mergedFields = _.assign({}, playerFields,
            { tripId: tripId });
          createInstance('players', mergedFields)(dispatch);
        });
      })
      .catch((err) => {
        console.error(err.message);
      });
  };
}
