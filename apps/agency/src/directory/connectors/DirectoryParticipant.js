import _ from 'lodash';
import { connect } from 'react-redux';

import DirectoryParticipant from '../components/DirectoryParticipant';
import { lookupExperience } from './utils';
import { instanceIncluder, instancesFromDatastore } from '../../datastore-utils';
import { createInstance, retrieveInstance, updateInstance } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  participant: _.find(state.datastore.participants, {
    id: Number(ownProps.match.params.participantId)
  }),
  profiles: instancesFromDatastore(state, {
    col: 'profiles',
    filter: {
      participantId: Number(ownProps.match.params.participantId),
      experience: { name: ownProps.match.params.experienceName }
    },
    include: {
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  })
});

const mapDispatchToProps = dispatch => ({
  retrieveInstance: (...args) => dispatch(retrieveInstance(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryParticipant);
