import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';

import AppConnector from './app/connectors/app';
import DesignRoute from './design/route';
import ScheduleRoute from './schedule/route';
import OperateRoute from './operate/route';
import UsersRoute from './users/route';

function InvalidPage() {
  return <div>Page not found</div>;
}

export default (
  <Router history={browserHistory}>
    <Route path="agency" component={AppConnector}>
      <IndexRedirect to="/agency/schedule" />
      {DesignRoute}
      {ScheduleRoute}
      {OperateRoute}
      {UsersRoute}
      <Route path="*" component={InvalidPage} />
    </Route>
  </Router>
);
