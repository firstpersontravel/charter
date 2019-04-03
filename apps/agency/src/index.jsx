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
import reducers from './reducers';

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

const authData = _(document.cookie.split(';'))
  .map(c => c.split('='))
  .filter(c => c[0] === 'auth_latest')
  .map(c => ({ id: 'latest', data: JSON.parse(atob(c[1])) }))
  .value();

const authOrgs = _.get(authData[0], 'data.orgs') || [];

const initialState = {
  requests: {},
  requestErrors: {},
  datastore: {
    auth: authData,
    orgs: authOrgs,
    assets: [],
    experiences: [],
    scripts: [],
    groups: [],
    profiles: [],
    trips: [],
    users: [],
    players: [],
    messages: [],
    relays: [],
    actions: []
  }
};

const store = createStore(reducers, initialState, enhancer);

const app = (
  <Provider store={store}>
    {Router}
  </Provider>
);

ReactDOM.render(app, document.getElementById('root'));
