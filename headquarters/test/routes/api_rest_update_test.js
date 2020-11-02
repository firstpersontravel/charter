const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const apiRestRoutes = require('../../src/routes/api_rest');

const { Model, assertThrows } = require('./api_rest_utils');

describe('apiRestRoutes', () => {
  let dummyAuthz;
  let req;
  let res;

  beforeEach(() => {
    dummyAuthz = {
      checkRecord: sinon.stub().returns(null),
      checkFields: sinon.stub().returns(null)
    };
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  describe('#updateRecordRoute', () => {
    it('returns a record', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findByPk').resolves(existingRecord);

      // Call the route
      await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 1,
            isShiny: null,
            timestamp: '2018-02-04T04:05:06.000Z',
            date: null,
            title: 'def'
          }
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findByPk, 10);

      // Assert save call made with fields argument
      sinon.assert.calledOnce(existingRecord.save);
      assert.deepStrictEqual(existingRecord.save.firstCall.args, [{
        fields: ['title']
      }]);

      // assert field was updated
      assert.strictEqual(existingRecord.title, 'def');
    });

    it('calls authorizer', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findByPk').resolves(existingRecord);

      // Call the route
      await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'update', Model, existingRecord);  

      sinon.assert.calledOnce(dummyAuthz.checkFields);
      sinon.assert.calledWith(dummyAuthz.checkFields,
        req, 'update', Model, existingRecord, req.body);  
    });

    it('returns 404 if not found', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      sandbox.stub(Model, 'findByPk').resolves(null);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);
      }, 404, 'Record not found.');
    });

    it('does not allow update with missing field', async () => {
      req.params = { recordId: '10' };
      req.body = { bad: 'doggy' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findByPk').resolves(existingRecord);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);
      }, 422, 'Invalid field: "bad".');
    });

    it('does not allow update with blacklisted field', async () => {
      const opts = { blacklistFields: ['timestamp'] };
      req.params = { recordId: '10' };
      req.body = { timestamp: '2018-02-04T02:05:06Z' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findByPk').resolves(existingRecord);

      // Call the route
      const route = apiRestRoutes.updateRecordRoute(Model, dummyAuthz, opts);
      await assertThrows(() => route(req, res),
        422, 'Invalid field: "timestamp".');
    });
  });
});
