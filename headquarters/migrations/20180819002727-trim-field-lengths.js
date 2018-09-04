'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('Actions', 'name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Actions', 'trigger_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Messages', 'message_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Messages', 'message_type',
      { type: 'VARCHAR(5)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Playthroughs', 'current_scene_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Participants', 'role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'as_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'for_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'with_role_name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
  },

  down: async (queryInterface) => {
    await queryInterface.changeColumn('Actions', 'name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Actions', 'trigger_name',
      { type: 'VARCHAR(128)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Messages', 'message_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Messages', 'message_type',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Playthroughs', 'current_scene_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Participants', 'role_name',
      { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'as_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'for_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
    await queryInterface.changeColumn('Relays', 'with_role_name',
      { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' });
  }
};
