import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactS3Uploader from 'react-s3-uploader';

import { ScriptCore } from 'fptcore';

const MEDIA_MIME_TYPES = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*'
};

function extraMediaReferences(resourceType, resource) {
  const paths = [];
  ScriptCore.walkResourceParams(resourceType, resource, 'media',
    (path, spec) => {
      paths.push({ path: path, medium: spec.medium });
    });
  return paths;
}

class MediaAsset extends Component {
  constructor(props) {
    super(props);
    this.state = { uploading: false, progress: null, error: null };
    this.handleUploadStart = this.handleUploadStart.bind(this);
    this.handleUploadProgress = this.handleUploadProgress.bind(this);
    this.handleUploadError = this.handleUploadError.bind(this);
    this.handleUploadFinish = this.handleUploadFinish.bind(this);
  }

  getAsset() {
    return this.props.assets
      .filter(asset => (
        asset.type === 'media' &&
        asset.data.medium === this.props.medium &&
        asset.data.path === this.props.path
      ))[0];
  }

  getFullPath() {
    const script = this.props.script;
    const subpath = this.props.path;
    return `${script.org.name}/${script.experience.name}/${subpath}`;
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

  handleUploadFinish() {
    this.setState({ uploading: false, progress: null, error: null });
    const bucket = process.env.S3_CONTENT_BUCKET;
    const fullPath = this.getFullPath();
    const publicUrl = `https://${bucket}.s3.amazonaws.com/${fullPath}`;
    this.updateAsset(publicUrl);
  }

  updateAsset(publicUrl) {
    const existingAsset = this.getAsset();
    if (existingAsset) {
      this.props.updateInstance('assets', existingAsset.id, {
        data: Object.assign(existingAsset.data, {
          url: publicUrl
        })
      });
    } else {
      const script = this.props.script;
      this.props.createInstance('assets', {
        orgId: script.orgId,
        experienceId: script.experienceId,
        name: this.props.path,
        type: 'media',
        data: {
          medium: this.props.medium,
          path: this.props.path,
          url: publicUrl
        }
      });
    }
  }

  isDynamic() {
    return this.props.path.indexOf('{{') >= 0;
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
      return 'Dynamic';
    }
    const matchingAsset = this.getAsset();
    if (matchingAsset) {
      return (
        <span className="text-success">
          Updated {moment.utc(matchingAsset.updatedAt).format('MMM DD, YYYY')}
        </span>
      );
    }
    return (
      <span className="text-danger">Not uploaded</span>
    );
  }

  renderUploader() {
    if (this.isDynamic()) {
      return ' (Uploading dynamic media is not yet supported.)';
    }
    const fullPath = this.getFullPath();
    const filename = fullPath.split('/').pop();
    const s3Folder = fullPath.substr(0, fullPath.length - filename.length);
    return (
      <ReactS3Uploader
        className="ml-1"
        signingUrl="/s3/sign"
        signingUrlMethod="GET"
        accept={MEDIA_MIME_TYPES[this.props.medium]}
        s3path={s3Folder}
        preprocess={this.handleUploadStart}
        onProgress={this.handleUploadProgress}
        onError={this.handleUploadError}
        onFinish={this.handleUploadFinish}
        uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}
        contentDisposition="auto"
        scrubFilename={f => filename}
        autoUpload />
    );
  }

  render() {
    const matchingAsset = this.getAsset();
    const link = matchingAsset ? (
      <a
        className="ml-1"
        href={matchingAsset.data.url}
        target="_blank"
        rel="noopener noreferrer">
        <i className="fa fa-external-link" />
      </a>
    ) : null;

    return (
      <div>
        {this.props.path}: {this.renderStatus()}
        {this.renderUploader()}
        {link}
      </div>
    );
  }
}

MediaAsset.propTypes = {
  script: PropTypes.object.isRequired,
  assets: PropTypes.array.isRequired,
  path: PropTypes.string.isRequired,
  medium: PropTypes.string.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};

export default function MediaAssets({ script, resourceType, resource, assets,
  createInstance, updateInstance }) {
  const mediaReferences = extraMediaReferences(resourceType, resource)
    .filter(ref => !!ref.path);
  if (mediaReferences.length === 0) {
    return null;
  }
  const renderedMediaAssets = mediaReferences.map(mediaReference => (
    <MediaAsset
      key={mediaReference.path}
      path={mediaReference.path}
      medium={mediaReference.medium}
      script={script}
      assets={assets}
      createInstance={createInstance}
      updateInstance={updateInstance} />
  ));
  return (
    <div className="card">
      <h5 className="card-header">
        Attached media
      </h5>
      <div className="card-body">
        {renderedMediaAssets}
      </div>
    </div>
  );
}

MediaAssets.propTypes = {
  script: PropTypes.object.isRequired,
  resourceType: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired,
  assets: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
