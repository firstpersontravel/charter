import React from 'react';
import { Route, IndexRoute } from 'react-router';

import HomeConnector from './connectors/Home';
import LoginConnector from './connectors/Login';

export default (
  <Route>
    <IndexRoute component={HomeConnector} />
    <Route path="login" component={LoginConnector} />
  </Route>
);
