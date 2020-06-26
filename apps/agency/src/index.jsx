import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import * as Sentry from '@sentry/browser';
// import createLogger from 'redux-logger';

import config from './config';
import Router from './router';
import reducers, { initialState } from './reducers';
import { associateAuthData } from './actions';

Sentry.init({
  dsn: window.config.FRONTEND_SENTRY_DSN,
  environment: window.config.FRONTEND_SENTRY_ENVIRONMENT,
  release: window.config.GIT_HASH
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

if (config.analyticsEnabled) {
  /* eslint-disable */

  // Intercom
  window.intercomSettings = { app_id: "m4npk55n" };
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/m4npk55n';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();

  // FullStory tracking code
  window._fs_debug = false;
  window._fs_host = 'fullstory.com';
  window._fs_script = 'edge.fullstory.com/s/fs.js';
  window._fs_org = 'V6Q0K';
  window._fs_namespace = 'FS';

  (function(m,n,e,t,l,o,g,y){
      if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
      g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
      o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
      y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
      g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
      g.anonymize=function(){g.identify(!!0)};
      g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
      g.log = function(a,b){g("log",[a,b])};
      g.consent=function(a){g("consent",!arguments.length||a)};
      g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
      g.clearUserCookie=function(){};
      g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
      if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
      g._v="1.2.0";
  })(window,document,window['_fs_namespace'],'script','user');
  /* eslint-enable */

  if (authData) {
    associateAuthData(authData);
  }
}
