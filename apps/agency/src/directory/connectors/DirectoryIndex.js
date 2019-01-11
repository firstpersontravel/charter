import { connect } from 'react-redux';

import DirectoryIndex from '../components/DirectoryIndex';
import { lookupExperience, lookupProfiles } from './utils';
import { createInstance } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  profiles: lookupProfiles(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryIndex);
