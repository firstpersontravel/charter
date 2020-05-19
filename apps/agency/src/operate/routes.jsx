import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import GroupConnector from './connectors/Group';
import GroupAllConnector from './connectors/GroupAll';
import GroupOverviewConnector from './connectors/GroupOverview';
import GroupMessagesConnector from './connectors/GroupMessages';
import GroupUpcomingConnector from './connectors/GroupUpcoming';
import TripConnector from './connectors/Trip';
import TripScenesConnector from './connectors/TripScenes';
import TripGalleryConnector from './connectors/TripGallery';
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
          path={`${match.path}/:roleName/:userId`}
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
        <Route
          path={`${match.path}/gallery`}
          component={TripGalleryConnector} />
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

function GroupRoutes({ match, history }) {
  return (
    <GroupConnector match={match}>
      <GroupAllConnector match={match} history={history}>
        <Switch>
          <Route
            path={match.path} exact
            component={GroupOverviewConnector} />
          <Route
            path={`${match.path}/role`}
            component={RolesRoutes} />
          <Route
            path={`${match.path}/messages`}
            component={GroupMessagesConnector} />
          <Route
            path={`${match.path}/upcoming`}
            component={GroupUpcomingConnector} />
          <Route
            path={`${match.path}/trip`}
            component={TripsRoutes} />
          <Route component={NotFound} />
        </Switch>
      </GroupAllConnector>
    </GroupConnector>
  );
}

GroupRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default function OperateRoutes({ match }) {
  return (
    <Route path={`${match.path}/:groupId`} component={GroupRoutes} />
  );
}

OperateRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
