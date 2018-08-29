import { connect } from 'react-redux';

import ScriptsIndex from '../components/ScriptsIndex';

const mapStateToProps = (state, ownProps) => ({
  scripts: state.datastore.scripts
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptsIndex);
