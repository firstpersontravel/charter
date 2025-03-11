import React from 'react';
import PropTypes from 'prop-types';

function renderHeader(header) {
  if (!header) {
    return null;
  }
  return <h4 className="alert-heading">{header}</h4>;
}

function renderAction(action) {
  if (!action) {
    return null;
  }
  return (
    <div>
      <hr />
      {action}
    </div>
  );
}

export default function Alert({
  color, header, content, action
}) {
  return (
    <div className="row" style={{ height: 'calc(100% - 66px)' }}>
      <div className="col-sm-12 my-auto">
        <div className="w-25 mx-auto">
          <div className={`alert alert-${color}`} role="alert">
            {renderHeader(header)}
            <div>{content}</div>
            {renderAction(action)}
          </div>
        </div>
      </div>
    </div>
  );
}

Alert.propTypes = {
  action: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  color: PropTypes.oneOf(['danger', 'warning', 'info', 'success']),
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired
};

Alert.defaultProps = {
  action: null,
  color: 'danger',
  header: null
};
