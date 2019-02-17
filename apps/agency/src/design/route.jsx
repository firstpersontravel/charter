import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import DesignIndexConnector from './connectors/DesignIndex';
import ScriptConnector from './connectors/Script';
import ReferenceConnector from './connectors/Reference';
import SliceConnector from './connectors/Slice';
import SliceIndexConnector from './connectors/SliceIndex';
import TestConnector from './connectors/Test';
import ResourceShowConnector from './connectors/ResourceShow';

export default (
  <Route path="script">
    <IndexRoute component={DesignIndexConnector} />
    <Route path=":revision" component={ScriptConnector}>
      <IndexRedirect to="/:orgName/:experienceName/script/:revision/design" />
      <Route path="test" component={TestConnector} />
      <Route path="reference" component={ReferenceConnector} />
      <Route path="design">
        <IndexRedirect to="/:orgName/:experienceName/script/:revision/design/section/overview" />
        <Route path=":sliceType">
          <Route path=":sliceName" component={SliceConnector}>
            <IndexRoute component={SliceIndexConnector} />
            <Route path=":collectionName">
              <Route path=":resourceName" component={ResourceShowConnector} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>
);
