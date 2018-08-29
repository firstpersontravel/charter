'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('message', {
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
      sent_by_id: {
        name: 'sentById',
        allowNull: false,
        type: 'INTEGER',
        references: {
          model: 'participant',
          key: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      sent_to_id: {
        name: 'sentToId',
        allowNull: false,
        type: 'INTEGER',
        references: {
          model: 'participant',
          key: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      sent_from_latitude: {
        type: 'DOUBLE PRECISION',
        validate: {}
      },
      sent_from_longitude: {
        type: 'DOUBLE PRECISION',
        validate: {}
      },
      sent_from_accuracy: {
        type: 'FLOAT',
        validate: {}
      },
      message_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      message_type: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      message_content: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: ''
      },
      sent_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      read_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      is_reply_needed: {
        type: 'TINYINT(1)',
        defaultValue: false,
        validate: {
          isIn: [
            [
              true,
              false
            ]
          ]
        }
      },
      reply_received_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      is_archived: {
        type: 'TINYINT(1)',
        defaultValue: false,
        validate: {
          isIn: [
            [
              true,
              false
            ]
          ]
        }
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('message');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
