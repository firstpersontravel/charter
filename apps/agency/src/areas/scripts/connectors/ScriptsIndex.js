import _ from 'lodash';
import { connect } from 'react-redux';

import ScriptsIndex from '../components/ScriptsIndex';

const mapStateToProps = (state, ownProps) => ({
  scripts: _.filter(state.datastore.scripts, {
    isArchived: false,
    isActive: true
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScriptsIndex);
