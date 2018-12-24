import { connect } from 'react-redux';

import { instancesStatus } from '../../../connector-utils';
import Scripts from '../components/Scripts';

const mapStateToProps = (state, ownProps) => ({
  scriptsStatus: instancesStatus(state, 'scripts', {
    isArchived: false
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Scripts);
