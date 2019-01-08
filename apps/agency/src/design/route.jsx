import React from 'react';
import { Route, IndexRoute } from 'react-router';

import DesignIndexConnector from './connectors/DesignIndex';
import ScriptConnector from './connectors/Script';
import ScriptIndexConnector from './connectors/ScriptIndex';
import CollectionConnector from './connectors/Collection';
import CollectionIndexConnector from './connectors/CollectionIndex';
import ResourceConnector from './connectors/Resource';
import ResourceIndexConnector from './connectors/ResourceIndex';

export default (
  <Route path="design">
    <IndexRoute component={DesignIndexConnector} />
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
