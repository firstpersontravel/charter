import _ from 'lodash';
import { connect } from 'react-redux';

import { listCollection, updateInstance } from '../../../actions';
import { assembleTripStatus } from '../../../connector-utils';
import TripGallery from '../components/TripGallery';

const mapStateToProps = (state, ownProps) => ({
  tripId: Number(ownProps.params.tripId),
  tripStatus: assembleTripStatus(state, ownProps.params.tripId),
  messages: _(state.datastore.messages)
    .filter({
      tripId: Number(ownProps.params.tripId),
      messageName: '',
      messageType: 'image'
    })
    .sortBy('createdAt')
    .value()
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripGallery);
