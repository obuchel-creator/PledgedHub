// Basic backend security audit script
const { exec } = require('child_process');

console.log('Running backend security audit...');
exec('npm audit --audit-level=moderate', { cwd: __dirname + '/../' }, (err, stdout, stderr) => {
  if (err) {
    console.error('Audit error:', err);
    process.exit(1);
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
  console.log('Security audit complete.');
});
