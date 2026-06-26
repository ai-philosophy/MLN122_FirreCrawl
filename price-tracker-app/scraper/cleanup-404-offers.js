import fs from 'fs';
import { execSync } from 'child_process';

async function main() {
  const results = JSON.parse(fs.readFileSync('url_check_results.json', 'utf8'));
  const urls404 = results.filter(r => r.status === 404).map(r => r.url);
  
  if (urls404.length === 0) {
    console.log('No 404 URLs found to clean up.');
    return;
  }
  
  console.log(`Cleaning up ${urls404.length} offers from the database...`);
  
  // Construct SQL query
  const sqlEscapedUrls = urls404.map(u => `'${u.replace(/'/g, "''")}'`).join(',');
  const query = `
    BEGIN;
    DELETE FROM price_histories WHERE merchant_offer_id IN (SELECT id FROM merchant_offers WHERE original_url IN (${sqlEscapedUrls}));
    DELETE FROM merchant_offers WHERE original_url IN (${sqlEscapedUrls});
    COMMIT;
  `;
  
  // Write to temporary SQL file in workspace
  fs.writeFileSync('cleanup.sql', query);
  
  try {
    console.log('Executing SQL query in docker container...');
    // Copy the SQL file to docker container or run it directly using -f
    execSync('docker cp cleanup.sql price_tracker_db:/tmp/cleanup.sql');
    const output = execSync('docker exec -t price_tracker_db psql -U postgres -d price_tracker -f /tmp/cleanup.sql', { encoding: 'utf8' });
    console.log('Database cleanup result:');
    console.log(output);
  } catch (err) {
    console.error('Error executing database cleanup:', err.message);
    if (err.stdout) console.error('Stdout:', err.stdout);
    if (err.stderr) console.error('Stderr:', err.stderr);
  } finally {
    // Clean up temporary files
    try {
      fs.unlinkSync('cleanup.sql');
      execSync('docker exec price_tracker_db rm -f /tmp/cleanup.sql');
    } catch (_) {}
  }
}

main().catch(err => console.error(err));
