import { connect } from 'react-redux';

import { instancesStatus } from '../../../connector-utils';
import Schedule from '../components/schedule';

const mapStateToProps = (state, ownProps) => ({
  scriptsStatus: instancesStatus(state, 'scripts', {
    isArchived: false
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Schedule);
