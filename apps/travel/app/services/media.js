import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
  upload: function(file, key) {
    const params = config.s3UploadParams;
    const url = `https://${params.bucket}.s3.amazonaws.com/`;
    const policyBase64 = btoa(JSON.stringify(params.policy));

    const form = new FormData();
    form.append('key', key);
    form.append('acl', 'private');
    form.append('AWSAccessKeyId', params.awsAccessKeyId);
    form.append('policy', policyBase64);
    form.append('signature', params.signature);
    form.append('success_action_status', '201');
    form.append('Content-Type', file.type);
    form.append('Cache-Control', 'max-age=31536000');
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      // xhr.upload.addEventListener('progress', progress, false);
      xhr.addEventListener('load', function() {
        if (this.status === 201) {
          resolve();
        } else {
          reject(new Error('S3 returned status ' + this.status));
        }
      }, false);
      xhr.addEventListener('error', function(err) {
        reject(err);
      }, false);
      xhr.open('POST', url, true);
      xhr.send(form);
    });
  }
});
