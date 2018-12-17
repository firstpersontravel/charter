import _ from 'lodash';
import { connect } from 'react-redux';

import ScriptSetVersions from '../components/ScriptSetVersions';

const mapStateToProps = (state, ownProps) => ({
  scriptName: ownProps.params.scriptName,
  scripts: _.filter(state.datastore.scripts, {
    name: ownProps.params.scriptName
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptSetVersions);
