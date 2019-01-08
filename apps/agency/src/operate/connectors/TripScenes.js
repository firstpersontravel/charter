import { connect } from 'react-redux';

import { postAction, postAdminAction } from '../../actions';
import { lookupTrip } from './utils';
import TripScenes from '../components/TripScenes';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  postAction: (...args) => dispatch(postAction(...args)),
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripScenes);
