import React from 'react';
import { Route, IndexRoute } from 'react-router';

import DirectoryConnector from './connectors/Directory';
import DirectoryIndexConnector from './connectors/DirectoryIndex';
import DirectoryUserConnector from './connectors/DirectoryUser';

export default (
  <Route path="directory" component={DirectoryConnector}>
    <IndexRoute component={DirectoryIndexConnector} />
    <Route path="user/:userId" component={DirectoryUserConnector} />
  </Route>
);
