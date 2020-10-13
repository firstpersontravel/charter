const { instrument } = require('../sentry');

function respondWithJson(res, data) {
  const json = instrument('json', 'stringify', () => JSON.stringify(data, null, 2));
  res.set('Content-Type', 'application/json');
  res.send(json);
}

module.exports = {
  respondWithJson: respondWithJson
};