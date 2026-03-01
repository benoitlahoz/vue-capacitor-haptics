import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const summaryPath = path.join(packageRoot, 'coverage', 'coverage-summary.json');
const readmePath = path.join(packageRoot, 'README.md');

if (!fs.existsSync(summaryPath)) {
  console.error('Coverage summary not found at:', summaryPath);
  process.exit(1);
}

if (!fs.existsSync(readmePath)) {
  console.error('README not found at:', readmePath);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
const total = summary.total;

const toPct = (value) => Number(value).toFixed(1);

const colorFor = (pct) => {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
};

const badge = (label, pct) => {
  const encodedValue = encodeURIComponent(`${toPct(pct)}%`);
  const color = colorFor(pct);
  return `![${label}](https://img.shields.io/badge/${label}-${encodedValue}-${color})`;
};

const badgesLine = [
  badge('statements', total.statements.pct),
  badge('branches', total.branches.pct),
  badge('functions', total.functions.pct),
  badge('lines', total.lines.pct),
].join(' ');

const startMarker = '<!-- coverage-badges:start -->';
const endMarker = '<!-- coverage-badges:end -->';

let readme = fs.readFileSync(readmePath, 'utf-8');

const block = `${startMarker}\n${badgesLine}\n${endMarker}`;

if (readme.includes(startMarker) && readme.includes(endMarker)) {
  const pattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'm');
  readme = readme.replace(pattern, block);
} else {
  const title = '# vue-capacitor-haptics';
  if (readme.startsWith(title)) {
    readme = readme.replace(title, `${title}\n\n${block}`);
  } else {
    readme = `${title}\n\n${block}\n\n${readme}`;
  }
}

fs.writeFileSync(readmePath, readme);
console.log('Coverage badges updated in README.md');
