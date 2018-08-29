'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('action', {
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
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      params: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      },
      trigger_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      event: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      },
      created_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      synced_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      scheduled_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      applied_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      failed_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('action');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
