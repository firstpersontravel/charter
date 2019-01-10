import _ from 'lodash';
import React from 'react';
import { IndexRoute, Router, Route, browserHistory } from 'react-router';
import { connectedRouterRedirect } from 'redux-auth-wrapper/history3/redirect';
import locationHelperBuilder from 'redux-auth-wrapper/history3/locationHelper';

import AppConnector from './app/connectors/App';
import ExperienceConnector from './app/connectors/Experience';
import OrgConnector from './app/connectors/Org';
import OrgIndexConnector from './app/connectors/OrgIndex';
import OrgExperienceConnector from './app/connectors/OrgExperience';

import DesignRoute from './design/route';
import OperateRoute from './operate/route';
import PublicConnector from './public/connectors/Public';
import PublicRoute from './public/route';
import ScheduleRoute from './schedule/route';
import DirectoryRoute from './directory/route';

function NotFound() {
  return (
    <div className="container-fluid">
      Page not found
    </div>
  );
}

function NoOrgs() {
  return (
    <div className="container-fluid">
      You are not a member of any organizations.
    </div>
  );
}

// Blank route for containing
function emptyRoute({ children }) { return children; }

function getUserInfo(state) {
  return _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
}

function LoadingSpinner() {
  return <div className="container-fluid">Loading...</div>;
}

const locationHelper = locationHelperBuilder({});

const ensureUserIsLoggedIn = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatingSelector: state => state.requests['auth.info'] !== 'fulfilled',
  authenticatedSelector: state => !!getUserInfo(state),
  AuthenticatingComponent: LoadingSpinner,
  wrapperDisplayName: 'UserIsAuthenticated'
});

const ensureUserIsNotLoggedIn = connectedRouterRedirect({
  redirectPath: (state, ownProps) => {
    const authInfo = getUserInfo(state);
    const firstOrg = _.get(authInfo, 'orgs[0]');
    const defaultPath = firstOrg ?
      `/${firstOrg.name}` : '/no-orgs';
    return locationHelper.getRedirectQueryParam(ownProps) || defaultPath;
  },
  allowRedirectBack: false,
  authenticatingSelector: state => state.requests['auth.info'] !== 'fulfilled',
  authenticatedSelector: state => !getUserInfo(state),
  AuthenticatingComponent: LoadingSpinner,
  wrapperDisplayName: 'UserIsNotAuthenticated'
});

export default (
  <Router history={browserHistory}>
    <Route component={AppConnector}>
      <Route component={ensureUserIsNotLoggedIn(emptyRoute)}>
        {PublicRoute}
      </Route>
      <Route component={ensureUserIsLoggedIn(emptyRoute)}>
        <Route path="no-orgs" component={PublicConnector}>
          <IndexRoute component={NoOrgs} />
        </Route>
        <Route path=":orgName" component={OrgConnector}>
          <IndexRoute component={OrgIndexConnector} />
        </Route>
        <Route path=":orgName/:experienceName" component={ExperienceConnector}>
          <IndexRoute component={OrgExperienceConnector} />
          {DesignRoute}
          {ScheduleRoute}
          {OperateRoute}
          {DirectoryRoute}
        </Route>
      </Route>
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
);
