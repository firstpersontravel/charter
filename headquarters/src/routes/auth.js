const bcrypt = require('bcrypt');

const models = require('../models');

const loginRoute = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await models.User.find({ email: email });
  const matchHash = user ? user.passwordHash : 'dummyHash';
  const isMatch = bcrypt.compare(password, matchHash);
  if (!isMatch) {
    res.status(401).send('Invalid email and password combination.');
    return;
  }
  res.status(200);
};

module.exports = {
  loginRoute
};
