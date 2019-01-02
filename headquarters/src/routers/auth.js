const express = require('express');

const { asyncRoute } = require('./utils');
const authRoutes = require('../routes/auth');

const authRouter = express.Router();

authRouter.post('/login', asyncRoute(authRoutes.loginRoute));
authRouter.post('/logout', asyncRoute(authRoutes.logoutRoute));
authRouter.get('/info', asyncRoute(authRoutes.infoRoute));

module.exports = authRouter;
