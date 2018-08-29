import { connect } from 'react-redux';

import Schedule from '../components/schedule';

const mapStateToProps = (state, ownProps) => ({
  scripts: state.datastore.scripts
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Schedule);
