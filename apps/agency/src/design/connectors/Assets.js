import { connect } from 'react-redux';

import Assets from '../components/Assets';
import { listCollection } from '../../actions';
import { lookupAssets, lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  assets: lookupAssets(state, ownProps),
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Assets);
