import React from 'react';
import { Router, Route, browserHistory } from 'react-router';

import AppConnector from './app/connectors/app';
import DesignRoute from './design/route';
import OperateRoute from './operate/route';
import PublicRoute from './public/route';
import ScheduleRoute from './schedule/route';
import UsersRoute from './users/route';

function NotFound() {
  return <div className="container-fluid">Page not found</div>;
}

export default (
  <Router history={browserHistory}>
    <Route component={AppConnector}>
      {PublicRoute}
      {DesignRoute}
      {OperateRoute}
      {ScheduleRoute}
      {UsersRoute}
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
);
