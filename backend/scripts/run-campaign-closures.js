const advancedReminderService = require('../services/advancedReminderService');

(async () => {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-d');

    console.log('Running campaign closures (manual)... dryRun=' + dryRun);
    const result = await advancedReminderService.processCampaignClosures({ dryRun });
    console.log('Result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error running campaign closures:', err);
    process.exit(1);
  }
})();
