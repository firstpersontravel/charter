import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import GroupConnector from './connectors/Group';
import GroupAllConnector from './connectors/GroupAll';
import GroupOverviewConnector from './connectors/GroupOverview';
import GroupPlayersConnector from './connectors/GroupPlayers';
import GroupRepliesConnector from './connectors/GroupReplies';
import GroupUpcomingConnector from './connectors/GroupUpcoming';
import TripConnector from './connectors/Trip';
import TripIndexConnector from './connectors/TripIndex';
import TripAchievementsConnector from './connectors/TripAchievements';
import TripScenesConnector from './connectors/TripScenes';
import TripControlsConnector from './connectors/TripControls';
import TripGalleryConnector from './connectors/TripGallery';
import TripScheduleConnector from './connectors/TripSchedule';
import TripValuesConnector from './connectors/TripValues';
import RoleConnector from './connectors/Role';
import RoleIndexConnector from './connectors/RoleIndex';
import RoleMessagesConnector from './connectors/RoleMessages';
import PlayerConnector from './connectors/Player';
import PlayerOverviewConnector from './connectors/PlayerOverview';
import PlayerMessagesConnector from './connectors/PlayerMessages';

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
      <Route path="replies" component={GroupRepliesConnector} />
      <Route path="upcoming" component={GroupUpcomingConnector} />
      <Route path="trip">
        <Route path=":tripId" component={TripConnector}>
          <IndexRoute component={TripIndexConnector} />
          <Route path="values" component={TripValuesConnector} />
          <Route path="schedule" component={TripScheduleConnector} />
          <Route path="scenes" component={TripScenesConnector} />
          <Route path="achievements" component={TripAchievementsConnector} />
          <Route path="controls" component={TripControlsConnector} />
          <Route path="gallery" component={TripGalleryConnector} />
          <Route path="players">
            <Route path=":roleName" component={PlayerConnector}>
              <IndexRoute component={PlayerOverviewConnector} />
              <Route path="messages">
                <IndexRedirect
                  to="/:orgName/:experienceName/operate/:groupId/trip/:tripId/players/:roleName/messages/All" />
                <Route
                  path=":withRoleName"
                  component={PlayerMessagesConnector} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>
);
