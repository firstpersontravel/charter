const _ = require('lodash');

const models = require('../models');

const galleryRoute = async (req, res) => {
  const alias = req.params.alias;
  const where = isNaN(Number(alias)) ? { galleryName: alias } : { id: alias };
  const playthrough = await models.Playthrough.find({
    where: where,
    include: [{
      model: models.Script,
      as: 'script'
    }]
  });
  if (!playthrough) {
    res.status(404);
    return;
  }

  // Find messages
  const messages = await models.Message.findAll({
    where: {
      playthroughId: playthrough.id,
      messageName: '',
      messageType: 'image',
      isArchived: false,
      isInGallery: true
    }
  });

  // Gather data items to send to template
  const galleryItems = messages.map(message => ({
    url: message.messageContent
  }));

  // Split into rows
  const galleryRows = _.chunk(galleryItems, 4);

  // Render
  res.render('gallery/gallery', {
    layout: 'gallery',
    tripTitle: playthrough.script.title,
    galleryRows: galleryRows
  });
};

module.exports = {
  galleryRoute,
};
