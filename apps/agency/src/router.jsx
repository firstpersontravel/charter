import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';

import AppConnector from './app/connectors/app';
import ScheduleRoute from './schedule/route';
import LiveRoute from './live/route';
import UsersRoute from './users/route';
import DesignRoute from './design/route';

function InvalidPage() {
  return <div>Page not found</div>;
}

export default (
  <Router history={browserHistory}>
    <Route path="agency" component={AppConnector}>
      <IndexRedirect to="/agency/schedule" />
      {ScheduleRoute}
      {LiveRoute}
      {UsersRoute}
      {DesignRoute}
      <Route path="*" component={InvalidPage} />
    </Route>
  </Router>
);
