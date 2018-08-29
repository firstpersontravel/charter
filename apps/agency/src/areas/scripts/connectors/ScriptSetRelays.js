import _ from 'lodash';
import { connect } from 'react-redux';

import ScriptSetRelays from '../components/ScriptSetRelays';
import { listCollection, updateInstance, updateRelays } from '../../../actions';
import { getStage } from '../../../utils';

const mapStateToProps = (state, ownProps) => ({
  areAnyRequestsPending: _.includes(_.values(state.requests), 'pending'),
  scriptName: ownProps.params.scriptName,
  script: _.find(state.datastore.scripts, {
    name: ownProps.params.scriptName
  }),
  relays: _.filter(state.datastore.relays, {
    scriptName: ownProps.params.scriptName,
    stage: getStage()
  })
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  updateRelays: (...args) => dispatch(updateRelays(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptSetRelays);
