import { connect } from 'react-redux';

import DirectoryIndex from '../components/DirectoryIndex';
import { lookupExperience, lookupProfiles, lookupUsers } from './utils';
import { createInstance } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  users: lookupUsers(state, ownProps),
  profiles: lookupProfiles(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryIndex);
