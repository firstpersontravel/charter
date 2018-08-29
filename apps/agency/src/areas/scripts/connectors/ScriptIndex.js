import _ from 'lodash';
import { connect } from 'react-redux';

import ScriptIndex from '../components/ScriptIndex';

const mapStateToProps = (state, ownProps) => ({
  scriptName: ownProps.params.scriptName,
  script: _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptIndex);
