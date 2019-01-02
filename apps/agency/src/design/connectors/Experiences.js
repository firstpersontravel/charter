import { connect } from 'react-redux';

import { instancesStatus } from '../../connector-utils';
import Experiences from '../components/Experiences';

const mapStateToProps = (state, ownProps) => ({
  scriptsStatus: instancesStatus(state, 'scripts', { isArchived: false })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Experiences);
