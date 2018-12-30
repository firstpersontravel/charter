import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';

import AppConnector from './areas/app/connectors/app';
import ScheduleRoute from './areas/schedule/route';
import LiveRoute from './areas/live/route';
import UsersRoute from './areas/users/route';
import DesignRoute from './areas/design/route';

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
