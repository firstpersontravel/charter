import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';

export default (
  <Route path="schedule" component={ScheduleConnector}>
    <IndexRoute component={ScheduleIndexConnector} />
  </Route>
);
