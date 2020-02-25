import React from 'react';
import { Route } from 'react-router';

import PublicConnector from './connectors/Public';
import PublicHomeConnector from './connectors/PublicHome';
import PublicLoginConnector from './connectors/PublicLogin';
import PublicSignupConnector from './connectors/PublicSignup';

export default (
  <Route component={PublicConnector}>
    <Route path="/" component={PublicHomeConnector} />
    <Route path="login" component={PublicLoginConnector} />
    <Route path="signup" component={PublicSignupConnector} />
  </Route>
);
