import _ from 'lodash';
import { connect } from 'react-redux';

import { listCollection, updateInstance } from '../../actions';
import { lookupTrip } from './utils';
import TripGallery from '../components/TripGallery';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps),
  messages: _(state.datastore.messages)
    .filter({
      tripId: Number(ownProps.match.params.tripId),
      name: '',
      medium: 'image'
    })
    .sortBy('createdAt')
    .value()
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripGallery);
