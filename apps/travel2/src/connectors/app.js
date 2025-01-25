import { connect } from 'react-redux';

import App from '../components/app';
import { refreshData } from '../actions';

const mapStateToProps = state => ({
  data: state.data
});

const mapDispatchToProps = dispatch => ({
  refreshData: (...args) => dispatch(refreshData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
