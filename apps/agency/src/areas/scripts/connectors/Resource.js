import _ from 'lodash';
import { connect } from 'react-redux';

import Resource from '../components/Resource';

const mapStateToProps = (state, ownProps) => ({
  script: _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Resource);
