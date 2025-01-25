import React from 'react';
import { Switch, Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

import Index from './connectors/index';
import App from './connectors/app';

export default (
  <BrowserRouter>
    <Switch>
      <Route path="/" exact component={Index} />
      <Route path="/:tripId/:playerId" component={App} />
    </Switch>
  </BrowserRouter>
);
