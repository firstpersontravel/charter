import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import * as Sentry from '@sentry/react';

import Router from './router';
import reducers, { initialState } from './reducers';

Sentry.init({
  dsn: window.config.TRAVEL2_SENTRY_DSN,
  environment: window.config.TRAVEL2_SENTRY_ENVIRONMENT,
  release: window.config.GIT_HASH
});

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

const initialStateCopy = _.cloneDeep(initialState);
const store = createStore(reducers, initialStateCopy, enhancer);

const app = (
  <Provider store={store}>
    {Router}
  </Provider>
);

ReactDOM.render(app, document.getElementById('root'));
