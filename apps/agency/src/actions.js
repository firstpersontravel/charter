import _ from 'lodash';
import 'whatwg-fetch';
import * as Sentry from '@sentry/browser';

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

function updateInstanceFields(collectionName, instanceId, fields) {
  return {
    type: 'updateInstanceFields',
    collectionName: collectionName,
    instanceId: instanceId,
    fields: fields
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

function processError(err) {
  Sentry.captureException(err);
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
    .then(
      (data) => {
        dispatch(saveRequest(requestName, 'fulfilled', null));
        return data;
      },
      (err) => {
        console.error(`Error requesting ${url}.`, params);
        console.error(err);
        const errdata = { data: err.data || null, status: err.status || null };
        dispatch(saveRequest(requestName, 'rejected', errdata));
        // Rethrow err, to be caught later in the stack.
        throw err;
      }
    );
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
      .catch(processError);
  };
}

export function makeAuthRequest(url, params, name) {
  const reqName = `auth.${name}`;
  return function (dispatch) {
    dispatch(saveRequest(reqName, 'pending', null));
    fetch(url, params)
      .then((response) => {
        // Login failure
        if (response.status === 401) {
          dispatch(saveRequest(reqName, 'fulfilled', null));
          dispatch(saveInstances('auth', [{ id: name, data: null }]));
          dispatch(saveInstances('auth', [{ id: 'latest', data: null }]));
          return;
        }
        // Other network error
        if (response.status !== 200) {
          dispatch(saveRequest(reqName, 'rejected', null));
          return;
        }
        // Login success
        response.json().then((data) => {
          dispatch(saveRequest(reqName, 'fulfilled', null));
          dispatch(saveInstances('auth', [{ id: name, data: data.data }]));
          dispatch(saveInstances('auth', [{ id: 'latest', data: data.data }]));
          if (data.data) {
            dispatch(saveInstances('orgs', data.data.orgs));
          }
          document.cookie = `auth_latest=${btoa(JSON.stringify(data.data))};`;
        });
      });
  };
}

export function fetchAuthInfo() {
  return makeAuthRequest('/auth/info', { method: 'GET' }, 'info');
}

export function login(email, password) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  };
  return makeAuthRequest('/auth/login', params, 'login');
}

export function logout() {
  return function (dispatch) {
    document.cookie = 'auth_latest=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    fetch('/auth/logout', { method: 'POST' })
      .then((response) => {
        if (response.status !== 200) {
          return;
        }
        dispatch(clearInstances('auth'));
        // Reload
        window.location.href = '/';
      });
  };
}

export function retrieveInstance(collectionName, instanceId) {
  if (!instanceId) {
    throw new Error('instanceId required to retrieveInstance');
  }
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    const url = `/api/${collectionName}/${instanceId}`;
    const params = { method: 'GET' };
    return request(collectionName, instanceId, 'get', url, params, dispatch)
      .then((response) => {
        dispatch(saveInstances(collectionName, [response.data[modelName]]));
      })
      .catch(processError);
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
      .catch(processError);
  };
}

export function updateInstance(collectionName, instanceId, fields) {
  if (!instanceId) {
    throw new Error('instanceId required to updateInstance');
  }
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    // First update instance in-place for fast responsiveness.
    dispatch(updateInstanceFields(collectionName, instanceId, fields));
    // Then dispatch the update request.
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
      .catch(processError);
  };
}

export function bulkUpdate(collectionName, query, fields) {
  return function (dispatch) {
    // Then dispatch the update request.
    const queryString = createQueryString(query);
    const url = `/api/${collectionName}${queryString}`;
    const params = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    };
    return request(collectionName, null, 'bulkUpdate', url, params, dispatch)
      .then((response) => {
        dispatch(saveInstances(collectionName, response.data[collectionName]));
        return response.data[collectionName];
      })
      .catch(processError);
  };
}

export function refreshLiveData(orgId, experienceId, tripIds) {
  return function (dispatch) {
    dispatch(listCollection('users', {
      orgId: orgId,
      experienceId: experienceId,
      isArchived: false
    }));
    dispatch(listCollection('trips', {
      orgId: orgId,
      experienceId: experienceId,
      id: tripIds
    }));
    dispatch(listCollection('players', {
      orgId: orgId,
      tripId: tripIds
    }));
    dispatch(listCollection('actions', {
      orgId: orgId,
      tripId: tripIds,
      appliedAt: 'null'
    }, { clear: true }));
    dispatch(listCollection('messages', {
      orgId: orgId,
      tripId: tripIds,
      sort: '-id',
      count: 100
    }));
  };
}

export function postAction(orgId, experienceId, tripId, actionName,
  actionParams) {
  return function (dispatch) {
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: actionName, params: actionParams })
    };
    const url = `/api/trips/${tripId}/actions`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(refreshLiveData(orgId, experienceId, [tripId]));
      })
      .catch(processError);
  };
}

export function postAdminAction(orgId, experienceId, tripId, actionName,
  actionParams, shouldRefresh = true) {
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
          dispatch(refreshLiveData(orgId, experienceId, [tripId]));
        }
      })
      .catch(processError);
  };
}

export function updateRelays(orgId, experienceId) {
  return function (dispatch) {
    const params = { method: 'POST' };
    const url = `/api/admin/experiences/${experienceId}/update_relays`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(listCollection('relays', {
          orgId: orgId,
          experienceId: experienceId,
          stage: getStage()
        }));
      })
      .catch(processError);
  };
}

export function createInstances(collection, fields, nextItems) {
  return function (dispatch) {
    createInstance(collection, fields)(dispatch)
      .then(createdItem => (
        Promise.all(nextItems || [], nextItems.map((next) => {
          const insertions = _.mapValues(next.insertions, (val, key) => (
            createdItem[val]
          ));
          const nextFields = Object.assign({}, next.fields, insertions);
          return createInstances(next.collection, nextFields,
            next.nextItems)(dispatch);
        }))
      ))
      .catch(processError);
  };
}
