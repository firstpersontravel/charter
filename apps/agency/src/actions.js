import _ from 'lodash';
import * as Sentry from '@sentry/browser';

import config from './config';
import { getStage } from './utils';

function reset() {
  return { type: 'reset' };
}

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

function updateRevisionHistory(recordName, oldContent, newContent) {
  return {
    type: 'updateRevisionHistory',
    recordName: recordName,
    oldContent: oldContent,
    newContent: newContent
  };
}

function setGlobalError(err) {
  return {
    type: 'setGlobalError',
    err: err
  };
}

function modelNameForCollectionName(collectionName) {
  return collectionName.substring(0, collectionName.length - 1);
}

function processError(err) {
  Sentry.withScope((scope) => {
    if (typeof FS === 'function' &&
        typeof FS.getCurrentSessionURL === 'function') {
      scope.setExtra('Fullstory Record', FS.getCurrentSessionURL(true));
    }
    Sentry.captureException(err);
  });
}

class RequestError extends Error {
  constructor(message, url, params, status, response) {
    super(message);
    this.url = url;
    this.params = params;
    this.status = status;
    this.response = response;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError);
    }
  }
}

function handleResponseError(url, params, response) {
  let responseData;
  return response.json()
    .then((data) => { responseData = data; })
    .catch(() => { responseData = '<invalid json>'; })
    .then(() => {
      throw new RequestError(
        `Failed ${params.method} to ${url}: ${response.status}.`,
        url, params, response.status, responseData);
    });
}

function getAuthToken() {
  const authData = JSON.parse(localStorage.getItem('auth_latest') || 'null');
  return authData ? authData.jwt : null;
}

function addAuthHeader(params) {
  const token = getAuthToken();
  if (!token) {
    return params;
  }
  return Object.assign({}, params, {
    headers: Object.assign({}, params.headers, {
      Authorization: `Bearer ${token}`
    })
  });
}

function fetchJsonAssuringSuccess(url, params) {
  return fetch(url, addAuthHeader(params))
    .then((response) => {
      if (response.status >= 400) {
        return handleResponseError(url, params, response);
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
    const url = `${config.serverUrl}/api/${collectionName}${queryString}`;
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

export function associateAuthData(authData) {
  const org = authData.orgs[0];
  // Sentry
  Sentry.configureScope((scope) => {
    scope.setUser({
      id: authData.user.id,
      email: authData.user.email,
      orgName: org && org.name
    });
  });
  // FullStory
  if (typeof FS === 'function') {
    FS.identify(`${getStage()}-${authData.user.id}`, {
      displayName: authData.user.fullName,
      email: authData.user.email
    });
  }
  // Intercom
  if (typeof Intercom === 'function') {
    const intercomSettings = {
      app_id: 'm4npk55n',
      name: authData.user.fullName,
      email: authData.user.email,
      user_id: authData.user.id,
      company: org ? { id: org.id, name: org.title } : null
      // created_at: 1312182000 // Signup date as a Unix timestamp
    };
    window.intercomSettings = intercomSettings;
    Intercom('update');
    // Intercom cookie for use in docs/charter site
    const intercomCookie = btoa(JSON.stringify(intercomSettings));
    document.cookie = `fpt_intercom=${intercomCookie};domain=.firstperson.travel`;
  }
}

function deassociateAuthData() {
  // FullStory
  if (typeof FS === 'function') {
    FS.anonymize();
  }
  // Intercom
  if (typeof Intercom === 'function') {
    Intercom('shutdown');
    // Clear intercom cookie
    document.cookie = 'fpt_intercom=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function trackEvent(eventName, metadata) {
  return function (dispatch) {
    // Intercom
    if (typeof Intercom === 'function') {
      Intercom('trackEvent', eventName, metadata);
    }
  };
}

function authenticate(dispatch, reqName, authData) {
  localStorage.setItem('auth_latest', JSON.stringify(authData));
  dispatch(saveInstances('auth', [{ id: reqName, data: authData }]));
  dispatch(saveInstances('auth', [{ id: 'latest', data: authData }]));
  if (!authData) {
    deassociateAuthData();
    return;
  }
  dispatch(saveInstances('orgs', authData.orgs));
  associateAuthData(authData);
}

export function makeAuthRequest(url, params, name) {
  const reqName = `auth.${name}`;
  return function (dispatch) {
    dispatch(saveRequest(reqName, 'pending', null));
    fetch(url, addAuthHeader(params))
      .then((response) => {
        // Login failure
        if (response.status === 401) {
          dispatch(saveRequest(reqName, 'fulfilled', null));
          dispatch(saveInstances('auth', [{ id: name, data: null }]));
          dispatch(saveInstances('auth', [{ id: 'latest', data: null }]));
          return null;
        }
        // Signup failure or forbidden token error
        if (response.status === 422 || response.status === 403) {
          return response.json()
            .then((data) => {
              dispatch(saveRequest(reqName, 'rejected', data.error));
              return null;
            });
        }
        // Other network error
        if (response.status !== 200) {
          dispatch(saveRequest(reqName, 'rejected', 'Network error'));
          return null;
        }
        // Login success
        return response.json()
          .then((data) => {
            authenticate(dispatch, name, data.data);
            dispatch(saveRequest(reqName, 'fulfilled', null));
          });
      })
      .catch((err) => {
        console.error('Unknown error', err);
        dispatch(saveRequest(reqName, 'rejected', 'Unknown error'));
        processError(err);
      });
  };
}

export function fetchAuthInfo() {
  return makeAuthRequest(`${config.serverUrl}/auth/info`,
    { method: 'GET' }, 'info');
}

export function login(email, password) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  };
  return makeAuthRequest(`${config.serverUrl}/auth/login`, params, 'login');
}

export function signup(fullName, email, password, orgTitle) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: fullName,
      email: email,
      password: password,
      orgTitle: orgTitle
    })
  };
  return makeAuthRequest(`${config.serverUrl}/auth/signup`, params, 'signup');
}

export function logout() {
  return function (dispatch) {
    localStorage.removeItem('auth_latest');
    dispatch(reset());
    deassociateAuthData();
  };
}

export function lostPassword(email) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  };
  return makeAuthRequest(`${config.serverUrl}/auth/lost-pw`, params,
    'lostPassword');
}

export function resetPassword(token, newPassword) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, newPassword: newPassword })
  };
  return makeAuthRequest(`${config.serverUrl}/auth/reset-pw`, params,
    'resetPassword');
}

export function retrieveInstance(collectionName, instanceId) {
  if (!instanceId) {
    throw new Error('instanceId required to retrieveInstance');
  }
  const modelName = modelNameForCollectionName(collectionName);
  return function (dispatch) {
    const url = `${config.serverUrl}/api/${collectionName}/${instanceId}`;
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
    const url = `${config.serverUrl}/api/${collectionName}`;
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
    const url = `${config.serverUrl}/api/${collectionName}/${instanceId}`;
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
    const url = `${config.serverUrl}/api/${collectionName}${queryString}`;
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
    dispatch(listCollection('participants', {
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
    const url = `${config.serverUrl}/api/trips/${tripId}/actions`;
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
    const url = `${config.serverUrl}/api/admin/trips/${tripId}/${actionName}`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        if (shouldRefresh === true) {
          dispatch(refreshLiveData(orgId, experienceId, [tripId]));
        }
      })
      .catch(processError);
  };
}

export function postEvent(orgId, experienceId, tripId, event) {
  return function (dispatch) {
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    };
    const url = `${config.serverUrl}/api/trips/${tripId}/events`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(refreshLiveData(orgId, experienceId, [tripId]));
      })
      .catch(processError);
  };
}

export function updateRelays(orgId, experienceId) {
  return function (dispatch) {
    const params = { method: 'POST' };
    const url = `${config.serverUrl}/api/admin/experiences/${experienceId}/update_relays`;
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
  let firstCreatedItem;
  const nextItemsArray = nextItems || [];
  return function (dispatch) {
    return createInstance(collection, fields)(dispatch)
      .then((createdItem) => {
        firstCreatedItem = createdItem;
        return Promise
          .all(nextItemsArray, nextItemsArray.map((next) => {
            const insertions = _.mapValues(next.insertions, (val, key) => (
              createdItem[val]
            ));
            const nextFields = Object.assign({}, next.fields, insertions);
            return createInstances(next.collection, nextFields,
              next.nextItems)(dispatch);
          }));
      })
      .then(() => firstCreatedItem)
      .catch(processError);
  };
}

export function createTrip(fields, nextItems) {
  return function (dispatch) {
    createInstances('trips', fields, nextItems)(dispatch)
      .then(trip => (
        postAdminAction(trip.orgId, trip.experienceId, trip.id, 'reset')(
          dispatch)
      ))
      .catch(processError);
  };
}

export function saveRevision(recordName, oldContent, newContent) {
  return updateRevisionHistory(recordName, oldContent, newContent);
}

export function crash(err, errInfo) {
  Sentry.withScope((scope) => {
    Object.keys(errInfo).forEach((key) => {
      scope.setExtra(key, errInfo[key]);
    });
    processError(err);
  });
  return setGlobalError(err);
}
