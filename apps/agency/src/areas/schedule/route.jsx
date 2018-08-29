import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScheduleConnector from './connectors/schedule';
import ScheduleIndexConnector from './connectors/schedule-index';

export default (
  <Route path="schedule" component={ScheduleConnector}>
    <IndexRoute component={ScheduleIndexConnector} />
  </Route>
);
