import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router';

import NotFound from '../partials/NotFound';
import HelpConnector from './connectors/Help';
import HelpReferenceConnector from './connectors/HelpReference';

export default function HelpRoutes({ match, location }) {
  return (
    <HelpConnector match={match} location={location}>
      <Switch>
        <Route path={`${match.path}/reference`} exact component={HelpReferenceConnector} />
        <Route component={NotFound} />
      </Switch>
    </HelpConnector>
  );
}

HelpRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
