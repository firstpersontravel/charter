import { connect } from 'react-redux';

import Script from '../components/Script';
import { listCollection, updateInstance } from '../../actions';
import { lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps),
  scripts: lookupScripts(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
