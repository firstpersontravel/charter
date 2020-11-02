import { connect } from 'react-redux';

import Directory from '../components/Directory';
import { lookupExperience, lookupProfiles } from './utils';

const mapStateToProps = (state, ownProps) => ({
  experience: lookupExperience(state, ownProps),
  profiles: lookupProfiles(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Directory);
