import { connect } from 'react-redux';

import DirectoryIndex from '../components/DirectoryIndex';
import { lookupExperience, lookupProfiles, lookupUsers } from './utils';
import { createInstances } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  users: lookupUsers(state, ownProps),
  profiles: lookupProfiles(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstances: (...args) => dispatch(createInstances(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryIndex);
