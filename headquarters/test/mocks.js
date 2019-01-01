const sinon = require('sinon');

const config = require('../src/config');

const sandbox = sinon.sandbox.create();

function createTestMocks() {
  sandbox.stub(config, 'getApnProvider').returns({
    send: sandbox.stub().resolves()
  });
  const twilioCallsClient = sandbox.stub().returns({
    update: sandbox.stub().resolves()
  });
  twilioCallsClient.create = sandbox.stub().resolves();
  const twilioStubClient = {
    calls: twilioCallsClient,
    messages: {
      create: sandbox.stub().resolves()
    }
  };
  sandbox.stub(config, 'getTwilioClient').returns(twilioStubClient);
  sandbox.stub(config, 'getFayeClient').returns({
    publish: sandbox.stub().resolves()
  });
}

function teardownTestMocks() {
  sandbox.restore();
}

module.exports = {
  createTestMocks: createTestMocks,
  sandbox: sandbox,
  teardownTestMocks: teardownTestMocks
};
