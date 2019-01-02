import _ from 'lodash';
import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import { connectedRouterRedirect } from 'redux-auth-wrapper/history3/redirect';
import locationHelperBuilder from 'redux-auth-wrapper/history3/locationHelper';

import AppConnector from './app/connectors/App';
import DesignRoute from './design/route';
import OperateRoute from './operate/route';
import PublicRoute from './public/route';
import ScheduleRoute from './schedule/route';
import UsersRoute from './users/route';

function NotFound() {
  return <div className="container-fluid">Page not found</div>;
}

// Blank route for containing
function emptyRoute({ children }) { return children; }

function isUserAuthenticated(state) {
  return !!_.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
}

function LoadingSpinner() {
  return <div className="container-fluid">Loading...</div>;
}

const locationHelper = locationHelperBuilder({});

const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatingSelector: state => state.requests['auth.info'] !== 'fulfilled',
  authenticatedSelector: state => isUserAuthenticated(state),
  AuthenticatingComponent: LoadingSpinner,
  wrapperDisplayName: 'UserIsAuthenticated'
});

const userIsNotAuthenticated = connectedRouterRedirect({
  redirectPath: (state, ownProps) => (
    locationHelper.getRedirectQueryParam(ownProps) || '/design/experiences'
  ),
  allowRedirectBack: false,
  authenticatingSelector: state => state.requests['auth.info'] !== 'fulfilled',
  authenticatedSelector: state => !isUserAuthenticated(state),
  AuthenticatingComponent: LoadingSpinner,
  wrapperDisplayName: 'UserIsNotAuthenticated'
});

export default (
  <Router history={browserHistory}>
    <Route component={AppConnector}>
      <Route component={userIsNotAuthenticated(emptyRoute)}>
        {PublicRoute}
      </Route>
      <Route component={userIsAuthenticated(emptyRoute)}>
        {DesignRoute}
        {OperateRoute}
        {ScheduleRoute}
        {UsersRoute}
      </Route>
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
);
