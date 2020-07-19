const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const apiRestRoutes = require('../../src/routes/api_rest');
const errors = require('../../src/errors');
const { Model, assertThrows } = require('./api_rest_utils');

const sampleRecord1 = Model.build({
  id: 1,
  isShiny: false,
  title: 'abc',
  date: '2018-01-01',
  timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
});
const sampleRecord2 = Model.build({
  id: 2,
  isShiny: true,
  title: 'def',
  date: '2018-03-03',
  timestamp: moment.utc('2018-03-05T04:05:06Z').toDate()
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

  describe('#listCollectionRoute', () => {
    it('lists a collection', async () => {
      req.query = { offset: 1, count: 5 };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          models: [{
            id: 1,
            isShiny: false,
            timestamp: '2018-02-04T04:05:06.000Z',
            date: '2018-01-01',
            title: 'abc'
          }, {
            id: 2,
            isShiny: true,
            timestamp: '2018-03-05T04:05:06.000Z',
            date: '2018-03-03',
            title: 'def'
          }]
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 5,
        offset: 1,
        order: [['id', 'ASC']],
        where: {}
      });
    });

    it('calls authorizer', async () => {
      req.query = { offset: 1, count: 5, title: 'search' };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledThrice(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'list', Model, { title: 'search' });
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord1);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord2);
    });

    it('returns error if authorizer denies request', async () => {
      req.query = { offset: 1, count: 5 };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);
      dummyAuthz.checkRecord.throws(errors.forbiddenError('Sample'));

      // Call the route and assert forbidden error.
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 403, 'Sample');
    });

    it('sorts ascending', async () => {
      req.query = { offset: 1, sort: 'id' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 250,
        offset: 1,
        order: [['id', 'ASC']],
        where: {}
      });
    });

    it('sorts descending', async () => {
      req.query = { offset: 1, sort: '-title' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 250,
        offset: 1,
        order: [['title', 'DESC']],
        where: {}
      });
    });

    it('returns bad request on invalid sort param', async () => {
      req.query = { offset: 1, sort: 'abc' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid sort parameter: abc.');
    });

    it('returns bad request on invalid filter param', async () => {
      req.query = { offset: 1, missingField: 'abc' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid query field: "missingField".');
    });

    it('returns bad request on invalid filter op', async () => {
      req.query = { offset: 1, isShiny__ne: 'abc' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid query operator: "ne".');

      req.query = { offset: 1, isShiny__abc: 'abc' };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid query operator: "abc".');

      req.query = { offset: 1, isShiny__: 'abc' };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid query operator: "".');
    });

    it('filters by parameters', async () => {
      const okValues = [
        ['isShiny', 'false', false],
        ['isShiny', 'true', true],
        ['title', 'abc', 'abc'],
        ['title', '123', '123'],
        ['id', '123', '123'],
        ['timestamp', '2018-02-04T04:05:06Z', '2018-02-04T04:05:06Z'],
      ];
      for (let [fieldName, queryValue, whereValue] of okValues) {
        req.query = { [fieldName]: queryValue };
        sandbox.stub(Model, 'findAll').resolves([]);

        // Call the route
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

        // Assert find call made
        assert.deepStrictEqual(Model.findAll.firstCall.args, [{
          limit: 250,
          offset: 0,
          order: [['id', 'ASC']],
          where: { [fieldName]: { [Sequelize.Op.eq]: whereValue } }
        }]);

        sandbox.restore();
      }
    });

    it('filters by parameters with operators', async () => {
      const okValues = [
        ['isShiny__eq', 'false', { [Sequelize.Op.eq]: false }],
        ['title__gt', 'abc', { [Sequelize.Op.gt]: 'abc' }],
        ['id__lt', '123', { [Sequelize.Op.lt]: '123' }],
        ['id__lte', '123', { [Sequelize.Op.lte]: '123' }],
        ['id__gt', '123', { [Sequelize.Op.gt]: '123' }],
        ['id__gte', '123', { [Sequelize.Op.gte]: '123' }],
        ['timestamp__lt', '2018-02-04', { [Sequelize.Op.lt]: '2018-02-04' }],
        ['timestamp__gte', '2018-02-04', { [Sequelize.Op.gte]: '2018-02-04' }],
        ['date__lte', '2018-02-04', { [Sequelize.Op.lte]: '2018-02-04' }],
        ['date__gt', '2018-02-04', { [Sequelize.Op.gt]: '2018-02-04' }]
      ];
      for (let [fieldName, queryValue, whereValue] of okValues) {
        req.query = { [fieldName]: queryValue };
        sandbox.stub(Model, 'findAll').resolves([]);

        // Call the route
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

        // Assert find call made
        assert.deepStrictEqual(Model.findAll.firstCall.args, [{
          limit: 250,
          offset: 0,
          order: [['id', 'ASC']],
          where: { [fieldName.split('__')[0]]: whereValue }
        }]);

        sandbox.restore();
      }
    });

    it('filters by null', async () => {
      req.query = { isShiny: 'null' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      assert.deepStrictEqual(Model.findAll.firstCall.args, [{
        limit: 250,
        offset: 0,
        order: [['id', 'ASC']],
        where: { isShiny: { [Sequelize.Op.eq]: null } }
      }]);
    });

    it('returns bad request on invalid query parameters', async () => {
      const okValues = [
        ['isShiny', '123'],
        ['isShiny', 'abc'],
        ['isShiny', 'fals'],
        ['id', 'abc'],
        ['timestamp', '2018-asd']
      ];
      for (let [fieldName, queryValue] of okValues) {
        req.query = { [fieldName]: queryValue };
        // Call the route
        await assertThrows(async () => {
          await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
        }, 400, `Invalid value "${queryValue}" for parameter ${fieldName}.`);
      }
    });

    it('filters by multiple with comma', async () => {
      req.query = { offset: 1, title: 'x,y' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledOnce(Model.findAll);
      assert.deepStrictEqual(Model.findAll.firstCall.args, [{
        limit: 250,
        offset: 1,
        order: [['id', 'ASC']],
        where: { title: { [Sequelize.Op.in]: ['x', 'y'] } }
      }]);
    });

    it('filters by multiple with multiple params', async () => {
      req.query = { offset: 1, title: ['x', 'y'] };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledOnce(Model.findAll);
      assert.deepStrictEqual(Model.findAll.firstCall.args, [{
        limit: 250,
        offset: 1,
        order: [['id', 'ASC']],
        where: { title: { [Sequelize.Op.in]: ['x', 'y'] } }
      }]);
    });

    it('hides blacklisted fields', async () => {
      const opts = {
        blacklistFields: ['timestamp', 'title', 'date']
      };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await (
        apiRestRoutes.listCollectionRoute(Model, dummyAuthz, opts)(req, res)
      );

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: { models: [{ id: 1, isShiny: false }, { id: 2, isShiny: true }] }
      });
    });

    it('fails if a required filter is not present', async () => {
      const opts = { requireFilters: ['isShiny'] };

      // Call the route
      const route = apiRestRoutes.listCollectionRoute(Model, dummyAuthz, opts);
      await assertThrows(() => route(req, res),
        400, 'Missing required filter: "isShiny".');
    });

    it('filters on falsy required filter', async () => {
      req.query = { isShiny: false };
      const opts = { requireFilters: ['isShiny'] };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await (
        apiRestRoutes.listCollectionRoute(Model, dummyAuthz, opts)(req, res)
      );

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(Model.findAll.firstCall.args, [{
        limit: 250,
        offset: 0,
        order: [['id', 'ASC']],
        where: { isShiny: { [Sequelize.Op.eq]: false } }
      }]);
    });
  });
});
