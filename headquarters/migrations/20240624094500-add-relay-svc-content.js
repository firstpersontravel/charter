'use strict';

const relayServiceRows = [
  ['development', 'Charter Local 1', '+12093221681', 'MGd19ffb55c6e66cc84eb84dbd2cdede92', 1],
  ['production', 'Charter Production 1', '+12762902593', 'MGf67465fa393f01c9b8e322c12721c03c', 1],
  ['production', 'Charter Production 2', '+14255216695', 'MG9a077a98725b8b433587ae600c426464', 0],
  ['production', 'Charter Production 3', '+14092481258', 'MGf9e24586e48fa09a7a462d30bda36485', 0],
  ['production', 'Charter Production 4', '+12692413728', 'MG117d886869789e469a22b17407713276', 0],
  ['production', 'Charter Production 5', '+14127753156', 'MG28c98bb5ee9e1136701d5d315c3ae344', 0],
  ['production', 'Charter Production 6', '+15022731706', 'MGd75f059bd332e2880385377cd61f5cbd', 0],
];

const relayEntrypointRows = [
  // FPT "Text testing" local
  [1, 837, 1, 'Welcome to FPT testing', ''],
  // FPT "Text testing" production
  [1, 837, 2, 'Welcome to FPT production', ''],
];

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('RelayServices', relayServiceRows.map(r => ({
      stage: r[0],
      title: r[1],
      phone_number: r[2],
      sid: r[3],
      is_active: r[4]
    })));

    await queryInterface.bulkInsert('RelayEntryways', relayEntrypointRows.map(r => ({
      org_id: r[0],
      experience_id: r[1],
      relay_service_id: r[2],
      welcome: r[3],
      keyword: r[4]
    })));
  },

  down: async () => {
    // No down
  }
};
