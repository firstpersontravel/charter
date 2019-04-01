import { connect } from 'react-redux';

import Script from '../components/Script';
import {
  bulkUpdate,
  listCollection,
  createInstance,
  updateInstance
} from '../../actions';
import { lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps),
  scripts: lookupScripts(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  bulkUpdate: (...args) => dispatch(bulkUpdate(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
