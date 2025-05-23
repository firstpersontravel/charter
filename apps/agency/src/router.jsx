import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Switch, Redirect, Route, withRouter
} from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect';
import locationHelperBuilder from 'redux-auth-wrapper/history4/locationHelper';

import { logout as logoutAction } from './actions';

import AppConnector from './app/connectors/App';
import ExperienceConnector from './app/connectors/Experience';
import FrameConnector from './app/connectors/Frame';
import OrgConnector from './app/connectors/Org';
import OrgIndexConnector from './app/connectors/OrgIndex';

import Alert from './partials/Alert';
import Loader from './partials/Loader';
import NotFound from './partials/NotFound';
import DesignRoutes from './design/routes';
import OperateRoutes from './operate/routes';
import PublicConnector from './public/connectors/Public';
import PublicRoutes from './public/routes';
import ScheduleRoutes from './schedule/routes';
import DirectoryRoutes from './directory/routes';

function LoaderWithNav() {
  return (
    <div>
      <Loader />
    </div>
  );
}

function NoOrgs() {
  return (
    <Alert
      color="warning"
      header="No workspaces"
      content={(
        <div>
          You are not a member of any workspaces. This shouldn&apos;t happen normally:
          {' '}
          please contact
          <a href="mailto:support@firstperson.travel">support@firstperson.travel</a>
          {' '}
          and we&apos;ll get one created for you right away.
        </div>
      )} />
  );
}

function getIsAuthenticating(state) {
  return false;
}

function getUserInfo(state) {
  return _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
}

const locationHelper = locationHelperBuilder({});

const ensureLoggedIn = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatingSelector: state => getIsAuthenticating(state),
  authenticatedSelector: state => !!getUserInfo(state),
  AuthenticatingComponent: LoaderWithNav,
  wrapperDisplayName: 'EnsureLoggedIn'
});

const ensureNotLoggedIn = connectedRouterRedirect({
  redirectPath: (state, ownProps) => {
    const authInfo = getUserInfo(state);
    const firstOrg = _.get(authInfo, 'orgs[0]');
    const defaultPath = firstOrg ? `/${firstOrg.name}` : '/no-orgs';
    return locationHelper.getRedirectQueryParam(ownProps) || defaultPath;
  },
  allowRedirectBack: false,
  authenticatingSelector: state => getIsAuthenticating(state),
  authenticatedSelector: state => !getUserInfo(state),
  AuthenticatingComponent: LoaderWithNav,
  wrapperDisplayName: 'EnsureNotLoggedIn'
});

function NoOrgsConnector() {
  return (
    <PublicConnector>
      <NoOrgs />
    </PublicConnector>
  );
}

function OrgRoutes({ match }) {
  return (
    <OrgConnector match={match}>
      <Route path={match.path} exact component={OrgIndexConnector} />
    </OrgConnector>
  );
}

OrgRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function ExperienceIndexRedirect({ match }) {
  return (
    <Redirect
      to={`/${match.params.orgName}/${match.params.experienceName}/script`} />
  );
}

ExperienceIndexRedirect.propTypes = {
  match: PropTypes.object.isRequired
};

function ExperienceRoutes({ match, history }) {
  return (
    <ExperienceConnector match={match} history={history}>
      <Switch>
        <Route path={match.path} exact component={ExperienceIndexRedirect} />
        <Route path={`${match.path}/script`} component={DesignRoutes} />
        <Route path={`${match.path}/schedule`} component={ScheduleRoutes} />
        <Route path={`${match.path}/operate`} component={OperateRoutes} />
        <Route path={`${match.path}/directory`} component={DirectoryRoutes} />
        <Route component={NotFound} />
      </Switch>
    </ExperienceConnector>
  );
}

ExperienceRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

class Logout extends React.Component {
  componentDidMount() {
    this.props.logout();
  }

  render() {
    return <Redirect to="/logged-out" />;
  }
}

Logout.propTypes = {
  logout: PropTypes.func.isRequired
};

const logoutMapper = dispatch => ({
  logout: () => dispatch(logoutAction())
});

const LogoutConnector = connect(null, logoutMapper)(Logout);

function AuthedIndex({ firstOrgName }) {
  return <Redirect to={`/${firstOrgName}`} />;
}

AuthedIndex.propTypes = {
  firstOrgName: PropTypes.string
};

AuthedIndex.defaultProps = {
  firstOrgName: null
};

const authedIndexMapper = (state, ownProps) => ({
  firstOrgName: _.get(getUserInfo(state), 'orgs[0].name') || 'no-orgs'
});

const AuthedIndexConnector = connect(authedIndexMapper)(AuthedIndex);

function AuthedRoutes() {
  return (
    <Switch>
      <Route path="/" exact component={AuthedIndexConnector} />
      <Route path="/login" exact component={AuthedIndexConnector} />
      <Route path="/signup" exact component={AuthedIndexConnector} />
      <Route path="/logout" exact component={LogoutConnector} />
      <Route path="/no-orgs" exact component={NoOrgsConnector} />
      <Route path="/:orgName/:experienceName" component={ExperienceRoutes} />
      <Route path="/:orgName" component={OrgRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AnonRoutes({ match }) {
  return (
    <Switch>
      {/* routes accessible both public and private go here */}
      <Route component={PublicRoutes} />
    </Switch>
  );
}

AnonRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

const AnonEnsuredNotLoggedIn = withRouter(ensureNotLoggedIn(AnonRoutes));
const AuthEnsuredLoggedIn = withRouter(ensureLoggedIn(AuthedRoutes));

function AppRoutes({ isAuthenticating, isAuthenticated }) {
  if (isAuthenticating) {
    return <Loader />;
  }
  if (isAuthenticated) {
    return <AuthEnsuredLoggedIn />;
  }
  return <AnonEnsuredNotLoggedIn />;
}

AppRoutes.propTypes = {
  isAuthenticating: PropTypes.bool.isRequired,
  isAuthenticated: PropTypes.bool.isRequired
};

const appRoutesMapper = (state, ownProps) => ({
  isAuthenticating: getIsAuthenticating(state),
  isAuthenticated: !!getUserInfo(state)
});

const AppRoutesConnector = connect(appRoutesMapper)(AppRoutes);

function FrameRoute({ history }) {
  return (
    <FrameConnector history={history}>
      <AppRoutesConnector />
    </FrameConnector>
  );
}

FrameRoute.propTypes = {
  history: PropTypes.object.isRequired
};

export default (
  <BrowserRouter>
    <AppConnector>
      <Route component={FrameRoute} />
    </AppConnector>
  </BrowserRouter>
);
