'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('actions', 'name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('actions', 'trigger_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('messages', 'message_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('messages', 'message_type',
      { type: 'VARCHAR(5)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('playthroughs', 'current_scene_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('participants', 'role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'as_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'for_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'with_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
  },

  down: async (queryInterface) => {
    await queryInterface.changeColumn('actions', 'name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('actions', 'trigger_name',
      { type: 'VARCHAR(128)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('messages', 'message_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('messages', 'message_type',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('playthroughs', 'current_scene_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('participants', 'role_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'as_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'for_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('relays', 'with_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
  }
};
