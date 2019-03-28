import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactS3Uploader from 'react-s3-uploader';

import { ResourcesRegistry, SubresourcesRegistry } from 'fptcore';

const MEDIA_MIME_TYPES = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*'
};

function extractMediaPaths(resourceClass, resource) {
  const props = Object.keys(resourceClass.properties);
  return props
    .filter(key => resourceClass.properties[key].type === 'media')
    .map(key => ({
      medium: resourceClass.properties[key].medium,
      path: resource[key]
    }));
}

function extractPanelPaths(panel) {
  if (!panel.type) {
    return [];
  }
  const panelClass = SubresourcesRegistry[`${panel.type}_panel`];
  if (!panelClass) {
    throw new Error(`Could not find panel ${panel.type}.`);
  }
  return extractMediaPaths(panelClass, panel);
}

function extraMediaReferences(resourceType, resource) {
  if (resourceType === 'page' || resourceType === 'content_page') {
    return _(resource.panels)
      .map(panel => extractPanelPaths(panel))
      .flatten()
      .value();
  }
  if (resourceType === 'message') {
    if (_.includes(['audio', 'image', 'video'], resource.medium)) {
      return [{ medium: resource.medium, path: resource.content }];
    }
  }
  const resourceClass = ResourcesRegistry[resourceType];
  return extractMediaPaths(resourceClass, resource);
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
    if (this.props.path.indexOf('{{') >= 0) {
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
    const fullPath = this.getFullPath();
    const filename = fullPath.split('/').pop();
    const s3Folder = fullPath.substr(0, fullPath.length - filename.length);
    return (
      <ReactS3Uploader
        style={{ marginLeft: '0.25em' }}
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
        style={{ marginLeft: '0.25em' }}
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
