import { connect } from 'react-redux';

import SliceResource from '../components/SliceResource';
import { createInstance, updateInstance } from '../../actions';
import { lookupScript, lookupScripts } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps),
  scripts: lookupScripts(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(SliceResource);
