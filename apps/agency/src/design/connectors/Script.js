import { connect } from 'react-redux';

import Script from '../components/Script';
import { lookupScript } from './utils';

const mapStateToProps = (state, ownProps) => ({
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Script);
