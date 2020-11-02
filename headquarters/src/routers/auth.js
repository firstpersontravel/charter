const express = require('express');

const { asyncRoute } = require('./utils');
const authRoutes = require('../routes/auth');

const authRouter = express.Router();

authRouter.post('/login', asyncRoute(authRoutes.loginRoute));
authRouter.post('/signup', asyncRoute(authRoutes.signupRoute));
authRouter.post('/lost-pw', asyncRoute(authRoutes.lostPasswordRoute));
authRouter.post('/reset-pw', asyncRoute(authRoutes.resetPasswordRoute));
authRouter.get('/info', asyncRoute(authRoutes.infoRoute));

module.exports = authRouter;
