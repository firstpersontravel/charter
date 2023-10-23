const program = require('commander');

const twilioUtil = require('../src/handlers/twilio_util');

program
  .option('--delete-relays', 'Delete the relays to be culled.')
  .option('--delete-numbers', 'Delete the twilio numbers to be culled.')
  .option('--update-hosts', 'Update any numbers with outdated hosts.')
  .option('--cull-threshold [days]', 'Days of inactivity after which to cull.')
  .option('--limit [limit]', 'Limit number of updates')
  .parse(process.argv);

twilioUtil.pruneNumbers(program)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
