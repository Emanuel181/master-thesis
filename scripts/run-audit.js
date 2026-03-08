const { execSync } = require('child_process');
const fs = require('fs');
const outPath = 'C:/Users/emanu/Desktop/master/audit-output.txt';

let output;
try {
    output = execSync('npm audit 2>&1', {
        encoding: 'utf8',
        cwd: 'C:/Users/emanu/Desktop/master',
        maxBuffer: 5 * 1024 * 1024
    });
} catch (err) {
    output = (err.stdout || '') + '\n' + (err.stderr || '') + '\nExit code: ' + err.status;
}
fs.writeFileSync(outPath, output, 'utf8');

