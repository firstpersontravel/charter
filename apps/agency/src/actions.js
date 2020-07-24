import _ from 'lodash';
import * as Sentry from '@sentry/browser';

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

function getRequestErrorInfo(err) {
  return {
    data: err.data || null,
    status: err.status || null,
    message: err.message || null
  };
}

function handleRequestError(err, dispatch) {
  dispatch(setGlobalError(getRequestErrorInfo(err)));
  processError(err);
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

function throwRequestError(url, params, response) {
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
        return throwRequestError(url, params, response);
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
        console.error(`Error with ${params.method} to ${url}.`);
        if (err.response) {
          console.error(JSON.stringify(err.response, null, 2));
        } else if (err.stack) {
          console.error(err.stack);
        }
        dispatch(saveRequest(requestName, 'rejected', getRequestErrorInfo(err)));
        // Rethrow to be caught by handleRequestError after
        // the individual calls have skipped their success handling.
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
      .catch(err => handleRequestError(err, dispatch));
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
        if (!response.status || response.status !== 200) {
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
        handleRequestError(err, dispatch);
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
  return makeAuthRequest('/auth/signup', params, 'signup');
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
  return makeAuthRequest('/auth/lost-pw', params, 'lostPassword');
}

export function resetPassword(token, newPassword) {
  const params = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, newPassword: newPassword })
  };
  return makeAuthRequest('/auth/reset-pw', params, 'resetPassword');
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
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
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
    const url = `/api/trips/${tripId}/actions`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(refreshLiveData(orgId, experienceId, [tripId]));
      })
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
  };
}

export function postEvent(orgId, experienceId, tripId, event) {
  return function (dispatch) {
    const params = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    };
    const url = `/api/trips/${tripId}/events`;
    request('system', null, 'action', url, params, dispatch)
      .then((response) => {
        dispatch(refreshLiveData(orgId, experienceId, [tripId]));
      })
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
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
      .catch(err => handleRequestError(err, dispatch));
  };
}

export function createTrip(fields, nextItems) {
  return function (dispatch) {
    createInstances('trips', fields, nextItems)(dispatch)
      .then(trip => (
        postAdminAction(trip.orgId, trip.experienceId, trip.id, 'reset')(
          dispatch)
      ))
      .catch(err => handleRequestError(err, dispatch));
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
