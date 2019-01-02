import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import DesignConnector from './connectors/Design';
import ExperiencesConnector from './connectors/Experiences';
import ExperiencesIndexConnector from './connectors/ExperiencesIndex';
import ScriptConnector from './connectors/Script';
import ScriptIndexConnector from './connectors/ScriptIndex';
import ExperienceConnector from './connectors/Experience';
import ExperienceScriptsConnector from './connectors/ExperienceScripts';
import ExperienceRelaysConnector from './connectors/ExperienceRelays';
import CollectionConnector from './connectors/Collection';
import CollectionIndexConnector from './connectors/CollectionIndex';
import ResourceConnector from './connectors/Resource';
import ResourceIndexConnector from './connectors/ResourceIndex';

export default (
  <Route path="design" component={DesignConnector}>
    <IndexRedirect to="/agency/design/experiences" />
    <Route path="experiences" component={ExperiencesConnector}>
      <IndexRoute component={ExperiencesIndexConnector} />
    </Route>
    <Route path="experience/:experienceName" component={ExperienceConnector}>
      <IndexRoute component={ExperienceScriptsConnector} />
      <Route path="relays" component={ExperienceRelaysConnector} />
    </Route>
    <Route path="script/:scriptId" component={ScriptConnector}>
      <IndexRoute component={ScriptIndexConnector} />
      <Route path="collection/:collectionName" component={CollectionConnector}>
        <IndexRoute component={CollectionIndexConnector} />
        <Route path="resource/:resourceName" component={ResourceConnector}>
          <IndexRoute component={ResourceIndexConnector} />
        </Route>
      </Route>
    </Route>
  </Route>
);
