import _ from 'lodash';
import { connect } from 'react-redux';

import Public from '../components/Public';

const mapStateToProps = state => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data')
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Public);
