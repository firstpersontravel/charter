'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('participant', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      playthrough_id: {
        name: 'playthroughId',
        allowNull: false,
        type: 'INTEGER',
        references: {
          model: 'playthrough',
          key: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      user_id: {
        name: 'userId',
        allowNull: true,
        type: 'INTEGER',
        references: {
          model: 'user',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      role_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      current_page_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      values: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('participant');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
