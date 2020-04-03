import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import * as Sentry from '@sentry/browser';
// import createLogger from 'redux-logger';

import Router from './router';
import reducers, { initialState } from './reducers';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.GIT_HASH
});

// const loggerMiddleware = createLogger();

// configure moment
moment.relativeTimeThreshold('ss', 1);
moment.relativeTimeThreshold('s', 60);
moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: '%d seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  }
});

/* eslint-disable no-underscore-dangle */
const enhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */
const enhancer = enhancers(
  applyMiddleware(
    thunkMiddleware,
    // loggerMiddleware
  )
);

const authData = JSON.parse(localStorage.getItem('auth_latest') || 'null');
const authOrgs = _.get(authData, 'orgs') || [];
const authInstances = authData ? [{ id: 'latest', data: authData }] : [];
const initialStateCopy = _.cloneDeep(initialState);
initialStateCopy.datastore.auth = authInstances;
initialStateCopy.datastore.orgs = authOrgs;

const store = createStore(reducers, initialStateCopy, enhancer);

const app = (
  <Provider store={store}>
    {Router}
  </Provider>
);

ReactDOM.render(app, document.getElementById('root'));
