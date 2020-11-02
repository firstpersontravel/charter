import { connect } from 'react-redux';

import Test from '../components/Test';
import { trackEvent } from '../../actions';
import { lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  trackEvent: (...args) => dispatch(trackEvent(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Test);
