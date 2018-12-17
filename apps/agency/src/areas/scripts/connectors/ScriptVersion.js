import _ from 'lodash';
import { connect } from 'react-redux';

import ScriptVersion from '../components/ScriptVersion';

const mapStateToProps = (state, ownProps) => ({
  script: _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptVersion);
