import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import ActiveTripsConnector from './connectors/ActiveTrips';
import ActiveTripsAllConnector from './connectors/ActiveTripsAll';
import ActiveTripsOverviewConnector from './connectors/ActiveTripsOverview';
import ActiveTripsMessagesConnector from './connectors/ActiveTripsMessages';
import ActiveTripsUpcomingConnector from './connectors/ActiveTripsUpcoming';
import TripConnector from './connectors/Trip';
import TripScenesConnector from './connectors/TripScenes';
import TripMessagesConnector from './connectors/TripMessages';
import TripScheduleConnector from './connectors/TripSchedule';
import TripValuesConnector from './connectors/TripValues';
import RoleConnector from './connectors/Role';
import RoleIndexConnector from './connectors/RoleIndex';

function RoleRoutes({ match }) {
  return (
    <RoleIndexConnector match={match} />
  );
}

RoleRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function RolesRoutes({ match }) {
  return (
    <RoleConnector match={match}>
      <Switch>
        <Route
          path={`${match.path}/:roleName/:participantId`}
          component={RoleRoutes} />
        <Route component={NotFound} />
      </Switch>
    </RoleConnector>
  );
}

RolesRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function TripRoutes({ match }) {
  return (
    <TripConnector match={match}>
      <Switch>
        <Redirect from={match.path} exact to={`${match.path}/scenes`} />
        <Route
          path={`${match.path}/values`}
          component={TripValuesConnector} />
        <Route
          path={`${match.path}/schedule`}
          component={TripScheduleConnector} />
        <Route
          path={`${match.path}/scenes`}
          component={TripScenesConnector} />
        <Route
          path={`${match.path}/messages`}
          component={TripMessagesConnector} />
        <Route component={NotFound} />
      </Switch>
    </TripConnector>
  );
}

TripRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function TripsRoutes({ match }) {
  return (
    <Route path={`${match.path}/:tripId`} component={TripRoutes} />
  );
}

TripsRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function ActiveTripsRoutes({ match, history }) {
  return (
    <ActiveTripsConnector match={match}>
      <ActiveTripsAllConnector match={match} history={history}>
        <Switch>
          <Route
            path={match.path}
            exact
            component={ActiveTripsOverviewConnector} />
          <Route
            path={`${match.path}/role`}
            component={RolesRoutes} />
          <Route
            path={`${match.path}/messages`}
            component={ActiveTripsMessagesConnector} />
          <Route
            path={`${match.path}/upcoming`}
            component={ActiveTripsUpcomingConnector} />
          <Route
            path={`${match.path}/trip`}
            component={TripsRoutes} />
          <Route component={NotFound} />
        </Switch>
      </ActiveTripsAllConnector>
    </ActiveTripsConnector>
  );
}

ActiveTripsRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default function OperateRoutes({ match }) {
  return (
    <Route path={match.path} component={ActiveTripsRoutes} />
  );
}

OperateRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
