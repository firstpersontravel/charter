import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';
import ScheduleGroupConnector from './connectors/ScheduleGroup';

export default (
  <Route path="schedule" component={ScheduleConnector}>
    <IndexRoute component={ScheduleIndexConnector} />
    <Route path=":groupId" component={ScheduleGroupConnector} />
  </Route>
);
