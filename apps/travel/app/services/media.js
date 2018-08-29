import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
  upload: function(file, key) {
    var params = config.s3UploadParams;
    var url = `https://${params.bucket}.s3.amazonaws.com/`;

    var form = new FormData();
    form.append('key', key);
    form.append('acl', 'private');
    form.append('AWSAccessKeyId', params.awsAccessKeyId);
    form.append('policy', btoa(JSON.stringify(params.policy)));
    form.append('signature', params.signature);
    form.append('success_action_status', '201');
    form.append('Content-Type', file.type);
    form.append('Cache-Control', 'max-age=31536000');
    form.append('file', file);

    var xhr = new XMLHttpRequest();
    var promise = new Ember.RSVP.Promise(function(resolve, reject) {
      // xhr.upload.addEventListener("progress", progress, false);
      xhr.addEventListener("load", function() {
        if (this.status === 201) {
          resolve();
        } else {
          reject(new Error('S3 returned status ' + this.status));
        }
      }, false);
      xhr.addEventListener("error", function(err) {
        console.error('error', err);
        reject(err);
      }, false);
      xhr.open('POST', url, true);
      xhr.send(form);
    });
    return promise;
  }
});
