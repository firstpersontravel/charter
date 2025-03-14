const express = require('express');

const twilioRoutes = require('../routes/twilio');
const { asyncRoute } = require('./utils');

// Create new twilioRouter
const twilioRouter = express.Router();

twilioRouter.post('/calls/incoming',
  asyncRoute(twilioRoutes.incomingCallRoute));
twilioRouter.post('/calls/incoming_status',
  asyncRoute(twilioRoutes.incomingCallStatusRoute));
twilioRouter.get('/calls/outgoing',
  asyncRoute(twilioRoutes.outgoingCallRoute));
twilioRouter.post('/calls/outgoing',
  asyncRoute(twilioRoutes.outgoingCallRoute));
twilioRouter.post('/calls/response',
  asyncRoute(twilioRoutes.callResponseRoute));
twilioRouter.post('/calls/status',
  asyncRoute(twilioRoutes.callStatusRoute));
twilioRouter.post('/calls/interrupt',
  asyncRoute(twilioRoutes.callInterruptRoute));
twilioRouter.post('/messages/incoming',
  asyncRoute(twilioRoutes.incomingMessageRoute));

module.exports = twilioRouter;
