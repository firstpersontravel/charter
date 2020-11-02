import { connect } from 'react-redux';

import DirectoryIndex from '../components/DirectoryIndex';
import { lookupExperience, lookupProfiles, lookupParticipants } from './utils';
import { createInstances } from '../../actions';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  participants: lookupParticipants(state, ownProps),
  profiles: lookupProfiles(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstances: (...args) => dispatch(createInstances(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DirectoryIndex);
