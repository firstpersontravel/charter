import React from 'react';
import { Redirect, Route, Switch } from 'react-router';

import NotFound from '../partials/NotFound';
import PublicConnector from './connectors/Public';
import PublicLoginConnector from './connectors/PublicLogin';
import PublicLoggedOutConnector from './connectors/PublicLoggedOut';
import PublicSignupConnector from './connectors/PublicSignup';
import PublicLostPasswordConnector from './connectors/PublicLostPassword';
import PublicResetPasswordConnector from './connectors/PublicResetPassword';

export default function PublicRoutes() {
  return (
    <PublicConnector>
      <Switch>
        <Redirect from="/" exact to="/login" />
        <Route path="/login" component={PublicLoginConnector} />
        <Route path="/signup" component={PublicSignupConnector} />
        <Route path="/lost-pw" component={PublicLostPasswordConnector} />
        <Route path="/reset-pw" component={PublicResetPasswordConnector} />
        <Route path="/logged-out" component={PublicLoggedOutConnector} />
        <Route component={NotFound} />
      </Switch>
    </PublicConnector>
  );
}
