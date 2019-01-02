import _ from 'lodash';
import { connect } from 'react-redux';

import Script from '../components/Script';

const mapStateToProps = (state, ownProps) => {
  const script = _.find(state.datastore.scripts, {
    id: Number(ownProps.params.scriptId)
  });
  const experience = _.find(state.datastore.experiences, {
    id: script && script.experienceId
  });
  return {
    script: script,
    experience: experience
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
