'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('Messages', 'message_name', 'name');
    await queryInterface.renameColumn('Messages', 'message_type', 'medium');
    await queryInterface.renameColumn('Messages', 'message_content', 'content');
    await queryInterface.renameColumn('Experiences', 'host', 'domain');
    await queryInterface.sequelize.query(`
      update Experiences
      set domain = ""
      where name = "theheadlandsgamble";
    `);
    await queryInterface.sequelize.query(`
      update Experiences
      set domain = "dispatch.tacosyndicate.family"
      where name = "tacosyndicate";
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('Messages', 'name', 'message_name');
    await queryInterface.renameColumn('Messages', 'medium', 'message_type');
    await queryInterface.renameColumn('Messages', 'content', 'message_content');
    await queryInterface.renameColumn('Experiences', 'domain', 'host');
  }
};
