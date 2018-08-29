import _ from 'lodash';
import { connect } from 'react-redux';

import UsersUser from '../components/users-user';
import { createInstance, listCollection, updateInstance }
  from '../../../actions';

const mapStateToProps = (state, ownProps) => {
  const user = _.find(state.datastore.users,
    { id: Number(ownProps.params.userId) });
  const profiles = _.filter(state.datastore.profiles,
    { userId: Number(ownProps.params.userId) });
  const participants = _.filter(state.datastore.participants, {
    userId: Number(ownProps.params.userId)
  });
  const activeRoles = participants
    .map((participant) => {
      const playthrough = _.find(state.datastore.playthroughs, {
        id: participant.playthroughId
      });
      const group = _.find(state.datastore.groups, {
        id: playthrough && playthrough.groupId
      });
      const script = _.find(state.datastore.scripts, {
        id: playthrough && playthrough.scriptId
      });
      return {
        participant: participant,
        playthrough: playthrough,
        group: group,
        script: script
      };
    })
    .filter(pAndP => pAndP.playthrough && !pAndP.playthrough.isArchived);

  return {
    user: user,
    profiles: profiles,
    scripts: state.datastore.scripts,
    activeRoles: activeRoles
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(UsersUser);
