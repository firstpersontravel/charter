const Authorizor = require('./logic/authorizer');
const Policy = require('./logic/policy');
const anonymousPolicies = require('./policies/anonymous');
const userPolicies = require('./policies/user');
const participantPolicies = require('./policies/participant');

// Create authorization framework
const allPolicies = anonymousPolicies.concat(userPolicies).concat(participantPolicies);
const combinedPolicy = new Policy(allPolicies);
const authz = new Authorizor(combinedPolicy);

module.exports = authz;