import React from 'react';
import { Switch, Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

import IndexComponent from './components/index';
import AppComponent from './components/app';

export default (
  <BrowserRouter>
    <Switch>
      <Route path="/" exact component={IndexComponent} />
      <Route path="/:tripId/:playerId" component={AppComponent} />
    </Switch>
  </BrowserRouter>
);
