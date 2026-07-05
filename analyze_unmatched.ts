import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const filePath = path.join(process.cwd(), 'seed_cems_unmatched_report.json');
  if (!fs.existsSync(filePath)) {
    console.error('Report not found');
    return;
  }
  const report = JSON.parse(fs.readFileSync(filePath, 'utf8')) as any[];
  
  console.log(`Analyzing ${report.length} unmatched rows:`);
  
  const groups: Record<string, number> = {};
  for (const item of report) {
    const key = `${item.departamento} | Prov: ${item.provincia} | Dist: ${item.distrito}`;
    groups[key] = (groups[key] || 0) + 1;
  }
  
  console.log('\nDistinct unmatched locations:');
  for (const [key, count] of Object.entries(groups)) {
    console.log(`- ${key} (occurs ${count} times)`);
  }
}

main().catch(console.error);
