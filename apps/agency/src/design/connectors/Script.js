import { connect } from 'react-redux';

import Script from '../components/Script';
import { updateInstance } from '../../actions';
import { lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps),
  scripts: lookupScripts(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
