import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router';

import NotFound from '../partials/NotFound';
import DirectoryConnector from './connectors/Directory';
import DirectoryIndexConnector from './connectors/DirectoryIndex';
import DirectoryParticipantConnector from './connectors/DirectoryParticipant';

export default function DirectoryRoutes({ match, location }) {
  return (
    <DirectoryConnector match={match} location={location}>
      <Switch>
        <Route path={match.path} exact component={DirectoryIndexConnector} />
        <Route
          path={`${match.path}/:participantId`}
          component={DirectoryParticipantConnector} />
        <Route component={NotFound} />
      </Switch>
    </DirectoryConnector>
  );
}

DirectoryRoutes.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
