const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const models = require('../../src/models');

const pageGalleryRoutes = require('../../src/routes/page_gallery');

const sandbox = sinon.sandbox.create();

describe('pageGalleryRoutes', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#galleryRoute', () => {
    it('shows gallery by name', async () => {
      const req = httpMocks.createRequest({ params: { alias: 'abc' } });
      const res = httpMocks.createResponse();

      // Stub responses
      const mockTrip = {
        id: 1,
        title: 'some people',
        script: { title: 'The Headlands Gamble' }
      };
      sandbox.stub(models.Trip, 'find').resolves(mockTrip);
      
      const mockMessages = [{
        createdAt: '2018-01-01T00:00:00',
        messageContent: 'test://abc'
      }, {
        createdAt: '2018-01-01T00:30:00',
        messageContent: 'test://def'
      }];
      sandbox.stub(models.Message, 'findAll').resolves(mockMessages);

      await pageGalleryRoutes.galleryRoute(req, res);

      // Test search calls made correctly
      sinon.assert.calledOnce(models.Trip.find);
      assert.deepStrictEqual(models.Trip.find.firstCall.args, [{
        where: { galleryName: 'abc' },
        include: [{ model: models.Script, as: 'script' }]
      }]);
      sinon.assert.calledOnce(models.Message.findAll);
      assert.deepStrictEqual(models.Message.findAll.firstCall.args, [{
        where: {
          tripId: 1,
          messageName: '',
          messageType: 'image',
          isArchived: false,
          isInGallery: true
        }
      }]);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getRenderView(), 'gallery/gallery');
      assert.deepStrictEqual(res._getRenderData(), {
        layout: 'gallery',
        tripTitle: 'The Headlands Gamble',
        galleryRows: [[{
          url: 'test://abc'
        }, {
          url: 'test://def'
        }]]
      });
    });

    it('returns 404 if trip not found', async () => {
      const req = httpMocks.createRequest({ params: { alias: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(models.Trip, 'find').resolves(null);

      await pageGalleryRoutes.galleryRoute(req, res);

      // Test call made correctly
      sinon.assert.calledOnce(models.Trip.find);
      assert.deepStrictEqual(models.Trip.find.firstCall.args, [{
        where: { id: 1 },
        include: [{ model: models.Script, as: 'script' }]
      }]);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 404);
    });
  });

});
  
