import React from 'react';
import { Route, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import PublicConnector from './connectors/Public';
import PublicHomeConnector from './connectors/PublicHome';
import PublicLoginConnector from './connectors/PublicLogin';
import PublicSignupConnector from './connectors/PublicSignup';

export default function PublicRoutes({ match }) {
  return (
    <PublicConnector match={match}>
      <Switch>
        <Route path="" exact component={PublicHomeConnector} />
        <Route path="/login" exact component={PublicLoginConnector} />
        <Route path="/signup" exact component={PublicSignupConnector} />
        <Route component={NotFound} />
      </Switch>
    </PublicConnector>
  );
}

PublicRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
