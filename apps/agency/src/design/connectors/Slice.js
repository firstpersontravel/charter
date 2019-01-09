import { connect } from 'react-redux';

import Slice from '../components/Slice';
import { lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Slice);
