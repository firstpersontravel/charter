import React from 'react';
import { Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';
import MonthIndexConnector from './connectors/MonthIndex';
import GroupConnector from './connectors/Group';
import GroupPlayersConnector from './connectors/GroupPlayers';

function GroupRoutes({ history, match, location }) {
  return (
    <GroupConnector history={history} match={match} location={location}>
      <Switch>
        <Route path={match.path} component={GroupPlayersConnector} />
        <Route component={NotFound} />
      </Switch>
    </GroupConnector>
  );
}

GroupRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

function MonthRoutes({ match, location, history }) {
  return (
    <ScheduleConnector match={match} location={location} history={history}>
      <Switch>
        <Route path={match.path} exact component={MonthIndexConnector} />
        <Route path={`${match.path}/:groupId`} component={GroupRoutes} />
        <Route component={NotFound} />
      </Switch>
    </ScheduleConnector>
  );
}

MonthRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default function ScheduleRoutes({ match }) {
  return (
    <Switch>
      <Route path={match.path} exact component={ScheduleIndexConnector} />
      <Route path={`${match.path}/:year/:month`} component={MonthRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

ScheduleRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
