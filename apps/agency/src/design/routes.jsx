import React from 'react';
import { Route, Redirect, Switch } from 'react-router';
import PropTypes from 'prop-types';

import NotFound from '../partials/NotFound';
import DesignIndexConnector from './connectors/DesignIndex';
import ScriptConnector from './connectors/Script';
import SliceConnector from './connectors/Slice';
import SliceIndexConnector from './connectors/SliceIndex';
import TestConnector from './connectors/Test';
import ResourceShowConnector from './connectors/ResourceShow';

function SliceRoutes({ match, history }) {
  return (
    <SliceConnector match={match} history={history}>
      <Switch>
        <Route path={match.path} exact component={SliceIndexConnector} />
        <Route
          path={`${match.path}/:collectionName/:resourceName`}
          component={ResourceShowConnector} />
        <Route component={NotFound} />
      </Switch>
    </SliceConnector>
  );
}

SliceRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

function ScriptDesignRoutes({ match }) {
  return (
    <Switch>
      <Redirect from={match.path} exact to={`${match.path}/section/roles`} />
      <Route
        path={`${match.path}/:sliceType/:sliceName`}
        component={SliceRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

ScriptDesignRoutes.propTypes = {
  match: PropTypes.object.isRequired
};

function ScriptRoutes({ match, location, history }) {
  return (
    <ScriptConnector match={match} location={location} history={history}>
      <Switch>
        <Redirect from={match.path} exact to={`${match.path}/design`} />
        <Route path={`${match.path}/test`} exact component={TestConnector} />
        <Route path={`${match.path}/design`} component={ScriptDesignRoutes} />
        <Route component={NotFound} />
      </Switch>
    </ScriptConnector>
  );
}

ScriptRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default function DesignRoutes({ match }) {
  return (
    <Switch>
      <Route path={match.path} exact component={DesignIndexConnector} />
      <Route path={`${match.path}/:revision`} component={ScriptRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

DesignRoutes.propTypes = {
  match: PropTypes.object.isRequired
};
