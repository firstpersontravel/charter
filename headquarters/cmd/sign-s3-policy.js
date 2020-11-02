const crypto = require('crypto');
const program = require('commander');

program
  .option('--secret-key-id [key]', 'Secret key')
  .parse(process.argv);

// Copied from apps/travel/config/environment.js
const policyData = {
  expiration: '2030-01-01T00:00:00.000Z',
  conditions: [
    {bucket: 'fpt-traveler-uploads'},
    {acl: 'private'},
    {success_action_status: '201'},
    ['starts-with', '$key', ''],
    ['starts-with', '$Content-Type', 'image/'],
    ['eq', '$Cache-Control', 'max-age=31536000'],
    ['content-length-range', 0, 20971520]
  ]
};

function createS3Policy() {
  const policyJson = JSON.stringify(policyData).toString('utf-8');
  const policyBuffer = Buffer.from(policyJson, 'utf-8');
  const policyBase64 = policyBuffer.toString('base64');
  const policySignature = crypto
    .createHmac('sha1', program.secretKeyId)
    .update(Buffer.from(policyBase64, 'utf-8'))
    .digest('base64');
  console.log(`Policy JSON:\n${policyJson}`);
  console.log(`Policy Base64:\n${policyBase64}`);
  console.log(`Policy Signature:\n${policySignature}`);
}

if (!program.secretKeyId) {
  program.help();
}

createS3Policy();
