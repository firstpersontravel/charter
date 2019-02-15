const sinon = require('sinon');

const config = require('../src/config');

const mocks = sinon.sandbox.create();
const sandbox = sinon.sandbox.create();

function createTestMocks() {
  mocks.stub(config, 'getApnProvider').returns({
    send: mocks.stub().resolves()
  });
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
  mocks.stub(config, 'getFayeClient').returns({
    publish: mocks.stub().resolves()
  });
}

function teardownTestMocks() {
  mocks.restore();
  sandbox.restore();
}

module.exports = {
  createTestMocks: createTestMocks,
  sandbox: sandbox,
  teardownTestMocks: teardownTestMocks
};
