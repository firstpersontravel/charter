module.exports = {
  icon: 'calendar',
  help: 'A period of activity for an actor player. It is used to organize different interactions when a player is taking part in multiple trips at the same time, and sort properly by start time.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'The role making the appearance.'
    },
    start: {
      type: 'reference',
      collection: 'times',
      help: 'The time at which the appearance starts. Used for sorting scenes in the actor interface.'
    }
  },
  getParentClaims: function(resource) {
    return ['roles.' + resource.role];
  }
};
