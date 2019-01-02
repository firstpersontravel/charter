const express = require('express');

const { asyncRoute } = require('./utils');
const authRoutes = require('../routes/auth');

const authRouter = express.Router();

authRouter.post('/login', asyncRoute(authRoutes.loginRoute));

module.exports = authRouter;
