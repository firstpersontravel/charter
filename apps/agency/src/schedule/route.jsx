import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScheduleIndexConnector from './connectors/ScheduleIndex';

export default (
  <Route path="schedule">
    <IndexRoute component={ScheduleIndexConnector} />
  </Route>
);
