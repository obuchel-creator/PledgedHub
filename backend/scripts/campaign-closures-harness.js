const fs = require('fs');
const path = require('path');
const advancedReminderService = require('../services/advancedReminderService');

(async () => {
  try {
    console.log('Previewing campaign closures (dry-run) and writing recipients to file...');
    const result = await advancedReminderService.processCampaignClosures({ dryRun: true });
    const outPath = path.join(__dirname, 'campaign-closures-preview.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log('Wrote preview to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Error in harness:', err);
    process.exit(1);
  }
})();
