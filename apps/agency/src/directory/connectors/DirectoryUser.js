import _ from 'lodash';
import { connect } from 'react-redux';

import DirectoryUser from '../components/DirectoryUser';
import { createInstance, listCollection, updateInstance }
  from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const authData = _.find(state.datastore.auth, { id: 'latest' }).data;
  const org = _.find(authData.orgs, { name: ownProps.params.orgName });
  const user = _.find(state.datastore.users,
    { id: Number(ownProps.params.userId) });
  const profiles = _.filter(state.datastore.profiles,
    { userId: Number(ownProps.params.userId) });
  const players = _.filter(state.datastore.players, {
    userId: Number(ownProps.params.userId)
  });
  const activeRoles = players
    .map((player) => {
      const trip = _.find(state.datastore.trips, {
        id: player.tripId
      });
      const group = _.find(state.datastore.groups, {
        id: trip && trip.groupId
      });
      const script = _.find(state.datastore.scripts, {
        id: trip && trip.scriptId
      });
      const experience = _.find(state.datastore.experiences, {
        id: trip && trip.experienceId
      });
      return {
        player: player,
        trip: trip,
        group: group,
        script: script,
        experience: experience
      };
    })
    .filter(pAndP => pAndP.trip && !pAndP.trip.isArchived);

  return {
    org: org,
    user: user,
    profiles: profiles,
    scripts: state.datastore.scripts,
    experiences: state.datastore.experiences,
    activeRoles: activeRoles
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryUser);
