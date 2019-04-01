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

  describe('#createRecordRoute', () => {
    it('creates a record', async () => {
      req.body = {
        title: 'ghi',
        timestamp: '2018-01-01T04:05:06.000Z',
        date: '2019-01-01'
      };
      let record;

      sandbox.stub(Model, 'build').callsFake(() => {
        record = new Model();
        sandbox.stub(record, 'save').callsFake(() => {
          record.id = 3;
        });
        return record;
      });

      // Call the route
      await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 201);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 3,
            isShiny: null,
            timestamp: '2018-01-01T04:05:06.000Z',
            date: '2019-01-01',
            title: 'ghi'
          }
        }
      });

      // Assert fields updated
      assert.deepStrictEqual(record.dataValues, {
        id: 3,
        title: req.body.title,
        date: '2019-01-01',
        timestamp: moment.utc(req.body.timestamp).toDate()
      });

      // Assert save call made without fields argument
      sinon.assert.calledOnce(record.save);
      assert.deepStrictEqual(record.save.firstCall.args, [{}]);
    });

    it('calls authorizer', async () => {
      req.body = { title: 'ghi', timestamp: '2018-01-01T04:05:06.000Z' };
      let record;

      sandbox.stub(Model, 'build').callsFake(() => {
        record = new Model();
        sandbox.stub(record, 'save').callsFake(() => {
          record.id = 3;
        });
        return record;
      });

      // Call the route
      await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'create', Model, null);
      sinon.assert.calledOnce(dummyAuthz.checkFields);
      sinon.assert.calledWith(dummyAuthz.checkFields,
        req, 'create', Model, null, req.body);
    });

    it('does not allow creation with id', async () => {
      req.body = { id: 5, title: 'ghi', timestamp: '2018-01-01T04:05:06Z' };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Id is not allowed on create.');
    });

    it('does not allow creation with unknown field', async () => {
      req.body = { missing: 123 };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);
      }, 422, 'Invalid field: "missing".');
    });

    it('does not allow creation with blacklisted field', async () => {
      const opts = { blacklistFields: ['title'] };
      req.body = { title: 'ghi', timestamp: '2018-01-01T04:05:06Z' };

      // Call the route
      const route = apiRestRoutes.createRecordRoute(Model, dummyAuthz, opts);
      await assertThrows(() => route(req, res),
        422, 'Invalid field: "title".');
    });
  });
});
