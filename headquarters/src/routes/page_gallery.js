const _ = require('lodash');

const models = require('../models');

const galleryRoute = async (req, res) => {
  const alias = req.params.alias;
  const where = isNaN(Number(alias)) ? { galleryName: alias } : { id: alias };
  const trip = await models.Trip.find({
    where: where,
    include: [{ model: models.Experience, as: 'experience' }]
  });
  if (!trip) {
    res.status(404);
    return;
  }

  // Find messages
  const messages = await models.Message.findAll({
    where: {
      tripId: trip.id,
      name: '',
      medium: 'image',
      isArchived: false,
      isInGallery: true
    }
  });

  // Gather data items to send to template
  const galleryItems = messages.map(message => ({
    url: message.content
  }));

  // Split into rows
  const galleryRows = _.chunk(galleryItems, 4);

  // Render
  res.render('gallery/gallery', {
    layout: 'gallery',
    tripTitle: trip.experience.title,
    galleryRows: galleryRows
  });
};

module.exports = {
  galleryRoute,
};
