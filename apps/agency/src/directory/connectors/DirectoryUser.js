import _ from 'lodash';
import { connect } from 'react-redux';

import DirectoryUser from '../components/DirectoryUser';
import { lookupExperience } from './utils';
import { instanceIncluder, instancesFromDatastore } from '../../datastore-utils';
import { createInstance, retrieveInstance, updateInstance } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  user: _.find(state.datastore.users, {
    id: Number(ownProps.params.userId)
  }),
  profiles: instancesFromDatastore(state, {
    col: 'profiles',
    filter: {
      userId: Number(ownProps.params.userId),
      experience: { name: ownProps.params.experienceName }
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

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryUser);
