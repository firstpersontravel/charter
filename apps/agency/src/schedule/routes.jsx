import moment from 'moment';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';
import ScheduleGroupConnector from './connectors/ScheduleGroup';
import GroupPlayersConnector from './connectors/GroupPlayers';

const curDate = moment.utc().format('YYYY/MM');

function ScheduleGroupRoutes({ match }) {
  return (
    <ScheduleGroupConnector match={match}>
      <Switch>
        <Route path={match.path} component={GroupPlayersConnector} />
        <Route component={NotFound} />
      </Switch>
    </ScheduleGroupConnector>
  );
}

ScheduleGroupRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function MonthRoutes({ match, location, history }) {
  return (
    <ScheduleConnector match={match} location={location} history={history}>
      <Switch>
        <Route path={match.path} exact component={ScheduleIndexConnector} />
        <Route
          path={`${match.path}/:groupId`}
          component={ScheduleGroupRoutes} />
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
      <Redirect from={match.path} exact to={`${match.path}/${curDate}`} />
      <Route path={`${match.path}/:year/:month`} component={MonthRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

ScheduleRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
