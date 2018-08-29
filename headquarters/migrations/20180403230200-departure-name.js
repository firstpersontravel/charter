'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('relay', 'schedule_name',
      'departure_name');
    await queryInterface.renameColumn('playthrough', 'schedule_name',
      'departure_name');
    await queryInterface.renameColumn('user', 'roles', 'profiles');
  },
  down: async (queryInterface) => {
    await queryInterface.renameColumn('relay', 'departure_name',
      'schedule_name');
    await queryInterface.renameColumn('playthrough', 'departure_name',
      'schedule_name');
    await queryInterface.renameColumn('user', 'profiles', 'roles');
  }
};
