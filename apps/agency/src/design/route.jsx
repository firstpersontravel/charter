import React from 'react';
import { Route, IndexRoute } from 'react-router';

import DesignIndexConnector from './connectors/DesignIndex';
import ScriptConnector from './connectors/Script';
import ScriptIndexConnector from './connectors/ScriptIndex';
import SliceConnector from './connectors/Slice';
import SliceIndexConnector from './connectors/SliceIndex';
import SliceResourceConnector from './connectors/SliceResource';

export default (
  <Route path="design">
    <IndexRoute component={DesignIndexConnector} />
    <Route path="script/:scriptId" component={ScriptConnector}>
      <IndexRoute component={ScriptIndexConnector} />
      <Route path=":sliceType">
        <Route path=":sliceName" component={SliceConnector}>
          <IndexRoute component={SliceIndexConnector} />
          <Route path=":collectionName/:resourceName" component={SliceResourceConnector} />
        </Route>
      </Route>
    </Route>
  </Route>
);
