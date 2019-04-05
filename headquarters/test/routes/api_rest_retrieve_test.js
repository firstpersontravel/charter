const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const apiRestRoutes = require('../../src/routes/api_rest');
const { Model, assertThrows } = require('./api_rest_utils');

const sampleRecord1 = Model.build({
  id: 1,
  isShiny: false,
  title: 'abc',
  date: '2018-01-01',
  timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
});

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

  describe('#retrieveRecordRoute', () => {
    it('returns a record', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findByPk').resolves(sampleRecord1);

      // Call the route
      await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 1,
            isShiny: false,
            timestamp: '2018-02-04T04:05:06.000Z',
            date: '2018-01-01',
            title: 'abc'
          }
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findByPk, 10);
    });

    it('omits blacklisted fields', async () => {
      const opts = { blacklistFields: ['isShiny', 'id' ] };
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findByPk').resolves(sampleRecord1);

      // Call the route
      await (
        apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz, opts)(req, res)
      );

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'abc',
            date: '2018-01-01'
          }
        }
      });
    });

    it('calls authorizer', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findByPk').resolves(sampleRecord1);

      // Call the route
      await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord1);
    });

    it('returns 404 if not found', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findByPk').resolves(null);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);
      }, 404, 'Record not found.');
    });
  });
});
