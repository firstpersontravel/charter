import { connect } from 'react-redux';

import { instancesStatus } from '../../../connector-utils';
import Design from '../components/Design';

const mapStateToProps = (state, ownProps) => ({
  scriptsStatus: instancesStatus(state, 'scripts', { isArchived: false })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Design);
