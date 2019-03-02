import moment from 'moment';
import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import ScheduleConnector from './connectors/Schedule';
import ScheduleIndexConnector from './connectors/ScheduleIndex';
import ScheduleGroupConnector from './connectors/ScheduleGroup';

const curDate = moment.utc().format('YYYY/MM');

export default (
  <Route path="schedule">
    <IndexRedirect to={`/:orgName/:experienceName/schedule/${curDate}`} />
    <Route path=":year/:month" component={ScheduleConnector}>
      <IndexRoute component={ScheduleIndexConnector} />
      <Route path=":groupId" component={ScheduleGroupConnector} />
    </Route>
  </Route>
);
