import React from 'react';
import { Route, IndexRedirect } from 'react-router';

import ScheduleIndexConnector from './connectors/ScheduleIndex';

export default (
  <Route path="operate">
    <IndexRedirect to="/:orgName/:experienceName/operate/schedule" />
    <Route path="schedule" component={ScheduleIndexConnector} />
  </Route>
);
