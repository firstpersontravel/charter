import React from 'react';
import { Route, IndexRoute } from 'react-router';

import UsersConnector from './connectors/users';
import UsersIndexConnector from './connectors/users-index';
import UsersUserConnector from './connectors/users-user';

export default (
  <Route path="users" component={UsersConnector}>
    <IndexRoute component={UsersIndexConnector} />
    <Route path="user/:userId" component={UsersUserConnector} />
  </Route>
);
