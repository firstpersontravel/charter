import React from 'react';
import { Route, IndexRoute } from 'react-router';

import GroupConnector from './connectors/Group';
import GroupAllConnector from './connectors/GroupAll';
import GroupOverviewConnector from './connectors/GroupOverview';
import GroupPlayersConnector from './connectors/GroupPlayers';
import GroupUpcomingConnector from './connectors/GroupUpcoming';
import TripConnector from './connectors/Trip';
import TripIndexConnector from './connectors/TripIndex';
import TripAchievementsConnector from './connectors/TripAchievements';
import TripScenesConnector from './connectors/TripScenes';
import TripControlsConnector from './connectors/TripControls';
import TripGalleryConnector from './connectors/TripGallery';
import TripMessagesConnector from './connectors/TripMessages';
import TripScheduleConnector from './connectors/TripSchedule';
import TripValuesConnector from './connectors/TripValues';
import RoleConnector from './connectors/Role';
import RoleIndexConnector from './connectors/RoleIndex';
import RoleMessagesConnector from './connectors/RoleMessages';

export default (
  <Route path="operate/:groupId" component={GroupConnector}>
    <Route component={GroupAllConnector}>
      <IndexRoute component={GroupOverviewConnector} />
      <Route path="casting" component={GroupPlayersConnector} />
      <Route path="role">
        <Route path=":roleName/:userId" component={RoleConnector}>
          <IndexRoute component={RoleIndexConnector} />
          <Route path="messages" component={RoleMessagesConnector} />
        </Route>
      </Route>
      <Route path="upcoming" component={GroupUpcomingConnector} />
      <Route path="trip">
        <Route path=":tripId" component={TripConnector}>
          <IndexRoute component={TripIndexConnector} />
          <Route path="values" component={TripValuesConnector} />
          <Route path="schedule" component={TripScheduleConnector} />
          <Route path="scenes" component={TripScenesConnector} />
          <Route path="messages" component={TripMessagesConnector} />
          <Route path="achievements" component={TripAchievementsConnector} />
          <Route path="controls" component={TripControlsConnector} />
          <Route path="gallery" component={TripGalleryConnector} />
        </Route>
      </Route>
    </Route>
  </Route>
);
