const sinon = require('sinon');
const moment = require('moment-timezone');

const config = require('../src/config');

const mocks = sinon.sandbox.create();
const sandbox = sinon.sandbox.create();

const oldUtc = moment.utc;
const mockNow = oldUtc();

function createTestMocks() {
  // Time
  mocks
    .stub(moment, 'utc')
    .callsFake(s => s ? oldUtc(s) : mockNow.clone());

  // Push notifications
  mocks.stub(config, 'getApnProvider').returns({
    send: mocks.stub().resolves()
  });

  // Twilio
  const twilioCallsClient = mocks.stub().returns({
    update: mocks.stub().resolves()
  });
  twilioCallsClient.create = mocks.stub().resolves();
  const twilioStubClient = {
    calls: twilioCallsClient,
    messages: { create: mocks.stub().resolves() },
    incomingPhoneNumbers: { list: mocks.stub().resolves() }
  };
  mocks.stub(config, 'getTwilioClient').returns(twilioStubClient);

  // Faye
  mocks.stub(config, 'getFayeClient').returns({
    publish: mocks.stub().resolves()
  });

  // Sendgrid
  const sendgridStubClient = {
    send: mocks.stub().resolves()
  };
  mocks.stub(config, 'getSendgridClient').returns(sendgridStubClient);
}

function teardownTestMocks() {
  mocks.restore();
  sandbox.restore();
}

module.exports = {
  createTestMocks: createTestMocks,
  sandbox: sandbox,
  mockNow: mockNow,
  teardownTestMocks: teardownTestMocks
};
