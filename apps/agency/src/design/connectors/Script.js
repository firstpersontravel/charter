import { connect } from 'react-redux';

import Script from '../components/Script';
import {
  bulkUpdate,
  listCollection,
  createInstance,
  updateInstance
} from '../../actions';
import { lookupExperiences, lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => {
  const script = lookupScript(state, ownProps);
  return {
    script: script,
    scripts: lookupScripts(state, ownProps),
    experiences: lookupExperiences(state, ownProps),
    revisionHistory: state.revisionHistory[script.id] || [],
    revisionHistoryUpdated: state.revisionHistory.lastUpdated
  };
};

const mapDispatchToProps = dispatch => ({
  bulkUpdate: (...args) => dispatch(bulkUpdate(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
