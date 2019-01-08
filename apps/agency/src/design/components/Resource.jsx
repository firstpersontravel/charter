import PropTypes from 'prop-types';

export default function Resource({ children }) {
  return children;
}

Resource.propTypes = {
  children: PropTypes.node.isRequired
};
