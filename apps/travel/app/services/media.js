import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
  upload: function(file, key) {
    const url = `https://${window.TRAVEL_UPLOAD_BUCKET}.s3.amazonaws.com/`;
    const form = new FormData();
    form.append('key', key);
    form.append('acl', 'private');
    form.append('AWSAccessKeyId', window.TRAVEL_UPLOAD_ACCESS_KEY);
    form.append('policy', window.TRAVEL_UPLOAD_POLICY_BASE64);
    form.append('signature', window.TRAVEL_UPLOAD_SIGNATURE);
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
