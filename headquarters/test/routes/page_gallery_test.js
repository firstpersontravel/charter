const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const pageGalleryRoutes = require('../../src/routes/page_gallery');

describe('pageGalleryRoutes', () => {
  describe('#galleryRoute', () => {
    it('shows gallery by name', async () => {
      const req = httpMocks.createRequest({ params: { alias: 'abc' } });
      const res = httpMocks.createResponse();

      // Stub responses
      const mockTrip = {
        id: 1,
        title: 'some people',
        experience: { title: 'The Headlands Gamble' }
      };
      sandbox.stub(models.Trip, 'find').resolves(mockTrip);
      
      const mockMessages = [{
        createdAt: '2018-01-01T00:00:00',
        content: 'test://abc'
      }, {
        createdAt: '2018-01-01T00:30:00',
        content: 'test://def'
      }];
      sandbox.stub(models.Message, 'findAll').resolves(mockMessages);

      await pageGalleryRoutes.galleryRoute(req, res);

      // Test search calls made correctly
      sinon.assert.calledOnce(models.Trip.find);
      assert.deepStrictEqual(models.Trip.find.firstCall.args, [{
        where: { galleryName: 'abc' },
        include: [{ model: models.Experience, as: 'experience' }]
      }]);
      sinon.assert.calledOnce(models.Message.findAll);
      assert.deepStrictEqual(models.Message.findAll.firstCall.args, [{
        where: {
          tripId: 1,
          name: '',
          medium: 'image',
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

      // Test not found.
      assert.strictEqual(res.statusCode, 404);
    });
  });

});
  
