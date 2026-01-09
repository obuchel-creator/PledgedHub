// Basic backend performance audit script
const { exec } = require('child_process');

console.log('Running backend performance audit (load test)...');
exec('npx autocannon -c 20 -d 10 http://localhost:5001/api/pledges', (err, stdout, stderr) => {
  if (err) {
    console.error('Performance test error:', err);
    process.exit(1);
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
  console.log('Performance audit complete.');
});
