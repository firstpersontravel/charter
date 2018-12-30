import _ from 'lodash';
import { connect } from 'react-redux';

import ExperiencesIndex from '../components/ExperiencesIndex';

const mapStateToProps = (state, ownProps) => ({
  scripts: _.filter(state.datastore.scripts, { isArchived: false }),
  experiences: _.filter(state.datastore.experiences, { isArchived: false })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ExperiencesIndex);
