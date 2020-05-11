import _ from 'lodash';
import { connect } from 'react-redux';

import Help from '../components/Help';

const mapStateToProps = (state, ownProps) => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data')
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Help);
