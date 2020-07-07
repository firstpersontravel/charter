import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactS3Uploader from 'react-s3-uploader';

import config from '../../../config';

const MEDIA_MIME_TYPES = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*'
};

class MediaField extends Component {
  constructor(props) {
    super(props);
    this.state = { uploading: false, progress: null, error: null };
    this.handleUploadStart = this.handleUploadStart.bind(this);
    this.handleUploadProgress = this.handleUploadProgress.bind(this);
    this.handleUploadError = this.handleUploadError.bind(this);
    this.handleUploadFinish = this.handleUploadFinish.bind(this);
  }

  getS3Folder() {
    const script = this.props.script;
    return `${script.org.name}/${script.experience.name}`;
  }

  handleUploadStart(file, next) {
    this.setState({ uploading: true, progress: 0, error: null });
    next(file);
  }

  handleUploadProgress(percent, status, file) {
    this.setState({ uploading: true, progress: percent, error: null });
  }

  handleUploadError(message, file) {
    this.setState({ uploading: false, progress: null, error: message });
  }

  handleUploadFinish(signResult) {
    this.setState({ uploading: false, progress: null, error: null });
    const bucketDomain = `https://${config.contentBucket}.s3.amazonaws.com`;
    const publicUrl = `${bucketDomain}/${signResult.fileKey}`;
    this.props.onPropUpdate(this.props.path, publicUrl);
  }

  isDynamic() {
    return this.props.value.indexOf('{{') === 0;
  }

  isUploaded() {
    return this.props.value.indexOf('http') === 0;
  }

  renderStatus() {
    if (this.state.uploading) {
      return 'Uploading...';
    }
    if (this.state.error) {
      return (
        <span className="text-danger">
          Error uploading: {this.state.error}
        </span>
      );
    }
    if (this.isDynamic()) {
      return this.props.value;
    }
    return null;
  }

  renderUploader() {
    // Clear old before uploading new
    if (this.isUploaded()) {
      return null;
    }
    if (this.isDynamic()) {
      return ' (Uploading dynamic media is not yet supported.)';
    }
    return (
      <ReactS3Uploader
        className="ml-2"
        style={this.state.uploading ? { display: 'none' } : null}
        signingUrl="/s3/sign"
        signingUrlMethod="GET"
        accept={MEDIA_MIME_TYPES[this.props.spec.medium]}
        s3path={`${this.getS3Folder()}/`}
        preprocess={this.handleUploadStart}
        onProgress={this.handleUploadProgress}
        onError={this.handleUploadError}
        onFinish={this.handleUploadFinish}
        uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}
        contentDisposition="auto"
        autoUpload />
    );
  }

  renderMedia() {
    if (!this.isUploaded()) {
      return null;
    }
    if (this.isDynamic()) {
      return null;
    }
    if (this.props.spec.medium === 'image') {
      return (
        <img
          alt={this.props.name}
          style={{ maxWidth: 300, maxHeight: 300 }}
          className="img-fluid"
          src={this.props.value} />
      );
    }
    if (this.props.spec.medium === 'video') {
      return (
        <video src={this.props.value} controls />
      );
    }
    if (this.props.spec.medium === 'audio') {
      return (
        <audio src={this.props.value} controls />
      );
    }
    return null;
  }

  render() {
    return (
      <span>
        {this.renderStatus()} {this.renderMedia()}
        {this.renderUploader()}
      </span>
    );
  }
}

MediaField.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  onPropUpdate: PropTypes.func.isRequired
};

MediaField.defaultProps = {
  value: '',
  opts: {}
};

export default MediaField;
