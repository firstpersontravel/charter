import React from 'react';
import { Route, IndexRoute } from 'react-router';

import ScriptsConnector from './connectors/Scripts';
import ScriptsIndexConnector from './connectors/ScriptsIndex';
import ScriptConnector from './connectors/Script';
import ScriptIndexConnector from './connectors/ScriptIndex';
import ScriptSetConnector from './connectors/ScriptSet';
import ScriptSetIndexConnector from './connectors/ScriptSetIndex';
import ScriptSetRelaysConnector from './connectors/ScriptSetRelays';
import CollectionConnector from './connectors/Collection';
import CollectionIndexConnector from './connectors/CollectionIndex';
import ResourceConnector from './connectors/Resource';
import ResourceIndexConnector from './connectors/ResourceIndex';

export default (
  <Route path="scripts" component={ScriptsConnector}>
    <IndexRoute component={ScriptsIndexConnector} />
    <Route path="scriptset/:scriptName" component={ScriptSetConnector}>
      <IndexRoute component={ScriptSetIndexConnector} />
      <Route path="relays" component={ScriptSetRelaysConnector} />
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
