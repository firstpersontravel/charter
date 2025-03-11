import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { isProduction } from '../../utils';
import { fullMediaUrl } from '../utils';

function updateInGallery(messageId, isInGallery, updateInstance) {
  updateInstance('messages', messageId, { isInGallery: isInGallery });
}

function renderMessage(trip, message, updateInstance) {
  const mediaUrl = fullMediaUrl(trip.org, trip.experience, message.content);
  const cellStyle = {
    float: 'left',
    width: '33%',
    maxWidth: '150px',
    marginBottom: '0.5em'
  };
  const imageStyle = message.isInGallery
    ? { maxHeight: '150px' }
    : { maxHeight: '150px', opacity: 0.5 };
  return (
    <div key={message.id} style={cellStyle}>
      <div>
        <img
          alt={message.content}
          src={mediaUrl}
          style={imageStyle}
          onClick={() => updateInGallery(
            message.id, !message.isInGallery, updateInstance
          )}
          className="img-fluid" />
      </div>
      <div>
        <input
          id={`message_${message.id}`}
          type="checkbox"
          checked={message.isInGallery}
          onChange={e => updateInGallery(message.id, e.target.checked,
            updateInstance)} />
        &nbsp;
        <label htmlFor={`message_${message.id}`}>
          {message.isInGallery ? 'Included' : 'Excluded'}
        </label>
        &nbsp;
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
          <i className="fa fa-external-link-alt" />
        </a>
      </div>
    </div>
  );
}

const defaultHost = `${window.location.protocol}//${window.location.host}`;

export default class TripGallery extends Component {
  componentDidMount() {
    this.loadData(this.props.trip);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.trip.id !== this.props.trip.id) {
      this.loadData(nextProps.trip);
    }
  }

  loadData(trip) {
    if (!trip) {
      return;
    }
    this.props.listCollection('messages', {
      orgId: trip.orgId,
      tripId: trip.id,
      medium: 'image'
    });
  }

  renderLink() {
    const { trip } = this.props;
    const host = (isProduction() && trip.script.host) || defaultHost;
    const url = `${host}/gallery/${trip.id}`;
    return (
      <p>
        Gallery link:&nbsp;
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={url}>
          {url}
        </a>
      </p>
    );
  }

  renderMessageRows() {
    return this.props.messages.map(message => (
      renderMessage(this.props.trip, message, this.props.updateInstance)
    ));
  }

  render() {
    return (
      <div>
        {this.renderLink()}
        {this.renderMessageRows()}
      </div>
    );
  }
}

TripGallery.propTypes = {
  messages: PropTypes.array.isRequired,
  trip: PropTypes.object.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
