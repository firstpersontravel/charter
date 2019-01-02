import { connect } from 'react-redux';

import App from '../components/app';
import { listCollection } from '../../actions';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
