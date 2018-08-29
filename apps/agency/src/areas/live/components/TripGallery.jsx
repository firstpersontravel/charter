import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { isProduction } from '../../../utils';

function updateInGallery(messageId, isInGallery, updateInstance) {
  updateInstance('messages', messageId, { isInGallery: isInGallery });
}

function renderMessage(message, updateInstance) {
  const mediaUrl = message.messageContent;
  const cellStyle = {
    float: 'left',
    width: '33%',
    maxWidth: '150px',
    marginBottom: '0.5em'
  };
  const imageStyle = message.isInGallery ?
    { maxHeight: '150px' } :
    { maxHeight: '150px', opacity: 0.5 };
  return (
    <div key={message.id} style={cellStyle}>
      <div>
        <img
          alt={mediaUrl}
          src={mediaUrl}
          style={imageStyle}
          onClick={() => updateInGallery(
            message.id, !message.isInGallery, updateInstance)}
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
          <i className="fa fa-external-link" />
        </a>
      </div>
    </div>
  );
}

const defaultHost = `${window.location.protocol}//${window.location.host}`;

export default class TripGallery extends Component {

  constructor(props) {
    super(props);
    this.editGalleryName = this.editGalleryName.bind(this);
  }

  componentDidMount() {
    this.loadData(this.props.tripId);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.tripId !== this.props.tripId) {
      this.loadData(nextProps.tripId);
    }
  }

  loadData(tripId) {
    this.props.listCollection('messages', {
      playthroughId: tripId,
      messageType: 'image',
      messageName: ''
    });
  }

  editGalleryName(e) {
    e.preventDefault();
    const trip = this.props.tripStatus.instance;
    const defaultGalleryName = _.kebabCase(trip.title);
    // eslint-disable-next-line no-alert
    const newGalleryName = prompt(
      'What would you like the new gallery name to be?',
      trip.galleryName || defaultGalleryName);
    if (newGalleryName && newGalleryName !== trip.galleryName) {
      this.props.updateInstance('playthroughs', trip.id, {
        galleryName: newGalleryName
      });
    }
  }

  renderLink() {
    const trip = this.props.tripStatus.instance;
    const host = (isProduction() && trip.script.host) || defaultHost;
    const [y, m, d] = trip.date.split('-');
    const alias = trip.galleryName || trip.id;
    const url = `${host}/gallery/${y}/${m}/${d}/${alias}`;
    return (
      <p>
        Gallery link:&nbsp;
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={url}>
          {url}
        </a>
        &nbsp;
        <span className="text-primary cursor-pointer" onClick={this.editGalleryName}>
          <i className="fa fa-pencil" />
        </span>
      </p>
    );
  }

  renderMessageRows() {
    return this.props.messages.map(message => (
      renderMessage(message, this.props.updateInstance)
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
  tripId: PropTypes.number.isRequired,
  tripStatus: PropTypes.object.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
