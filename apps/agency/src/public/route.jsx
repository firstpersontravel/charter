import React from 'react';
import { Route } from 'react-router';

import HomeConnector from './connectors/Home';
import LoginConnector from './connectors/Login';

export default (
  <Route>
    <Route path="/" component={HomeConnector} />
    <Route path="login" component={LoginConnector} />
  </Route>
);
