'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Scripts', 'revision', {
      type: 'INTEGER',
      allowNull: false,
      after: 'experience_id'
    });
    await queryInterface.renameColumn('Scripts', 'version', 'content_version');
    await queryInterface.changeColumn('Scripts', 'is_active', {
      type: 'TINYINT(1)',
      after: 'content',
      allowNull: false
    });
    await queryInterface.changeColumn('Scripts', 'is_archived', {
      type: 'TINYINT(1)',
      after: 'is_active',
      allowNull: false
    });
    await queryInterface.changeColumn('Profiles', 'is_active', {
      type: 'TINYINT(1)',
      after: 'values',
      allowNull: false
    });
    await queryInterface.changeColumn('Profiles', 'is_archived', {
      type: 'TINYINT(1)',
      after: 'is_active',
      allowNull: false
    });
    await queryInterface.changeColumn('Messages', 'is_in_gallery', {
      type: 'TINYINT(1)',
      after: 'reply_received_at',
      allowNull: false
    });
    await queryInterface.changeColumn('Experiences', 'is_archived', {
      type: 'TINYINT(1)',
      after: 'timezone',
      allowNull: false
    });
    await queryInterface.changeColumn('Actions', 'is_archived', {
      type: 'TINYINT(1)',
      after: 'failed_at',
      allowNull: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('Scripts', 'content_version', 'version');
    await queryInterface.removeColumn('Scripts', 'revision');
  }
};
