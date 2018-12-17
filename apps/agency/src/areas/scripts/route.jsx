import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScriptsConnector from './connectors/Scripts';
import ScriptsIndexConnector from './connectors/ScriptsIndex';
import ScriptVersionConnector from './connectors/ScriptVersion';
import ScriptVersionIndexConnector from './connectors/ScriptVersionIndex';
import ScriptSetConnector from './connectors/ScriptSet';
import ScriptSetVersionsConnector from './connectors/ScriptSetVersions';
import ScriptSetRelaysConnector from './connectors/ScriptSetRelays';
import CollectionConnector from './connectors/Collection';
import CollectionIndexConnector from './connectors/CollectionIndex';
import ResourceConnector from './connectors/Resource';
import ResourceIndexConnector from './connectors/ResourceIndex';

export default (
  <Route path="scripts" component={ScriptsConnector}>
    <IndexRoute component={ScriptsIndexConnector} />
    <Route path="script/:scriptName" component={ScriptSetConnector}>
      <IndexRoute component={ScriptSetVersionsConnector} />
      <Route path="relays" component={ScriptSetRelaysConnector} />
    </Route>
    <Route path="version/:scriptId" component={ScriptVersionConnector}>
      <IndexRoute component={ScriptVersionIndexConnector} />
      <Route path="collection/:collectionName" component={CollectionConnector}>
        <IndexRoute component={CollectionIndexConnector} />
        <Route path="resource/:resourceName" component={ResourceConnector}>
          <IndexRoute component={ResourceIndexConnector} />
        </Route>
      </Route>
    </Route>
  </Route>
);
