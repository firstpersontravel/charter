import { connect } from 'react-redux';

import ResourceShow from '../components/ResourceShow';
import {
  createInstance,
  updateInstance,
  saveRevision,
  trackEvent
} from '../../actions';
import { lookupAssets, lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps),
  scripts: lookupScripts(state, ownProps),
  assets: lookupAssets(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  saveRevision: (...args) => dispatch(saveRevision(...args)),
  trackEvent: (...args) => dispatch(trackEvent(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ResourceShow);
