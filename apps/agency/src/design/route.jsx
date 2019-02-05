import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import AssetsConnector from './connectors/Assets';
import AssetsAssetConnector from './connectors/AssetsAsset';
import AssetsIndexConnector from './connectors/AssetsIndex';
import DesignIndexConnector from './connectors/DesignIndex';
import ScriptConnector from './connectors/Script';
import SliceConnector from './connectors/Slice';
import SliceIndexConnector from './connectors/SliceIndex';
import ResourceShowConnector from './connectors/ResourceShow';

export default (
  <Route path="design">
    <IndexRoute component={DesignIndexConnector} />
    <Route path="script/:revision" component={ScriptConnector}>
      <IndexRedirect to="/:orgName/:experienceName/design/script/:revision/section/roles" />
      <Route path="assets" component={AssetsConnector}>
        <IndexRoute component={AssetsIndexConnector} />
        <Route path=":assetName" component={AssetsAssetConnector} />
      </Route>
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
);
