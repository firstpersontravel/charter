import React from 'react';
import { Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';
import MonthIndexConnector from './connectors/MonthIndex';
import TripConnector from './connectors/Trip';
import TripPlayersConnector from './connectors/TripPlayers';

function TripRoutes({ history, match, location }) {
  return (
    <TripConnector history={history} match={match} location={location}>
      <Switch>
        <Route path={match.path} component={TripPlayersConnector} />
        <Route component={NotFound} />
      </Switch>
    </TripConnector>
  );
}

TripRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

function MonthRoutes({ match, location, history }) {
  return (
    <ScheduleConnector match={match} location={location} history={history}>
      <Switch>
        <Route path={match.path} exact component={MonthIndexConnector} />
        <Route path={`${match.path}/:tripId`} component={TripRoutes} />
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
