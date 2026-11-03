import { isSupabaseConfigured, verifySupabaseConnection } from '../src/lib/supabase';

async function runVerification() {
  console.log('\n======================================================');
  console.log('   Kisan Sahayak – Supabase Endpoint Verification    ');
  console.log('======================================================\n');

  console.log(`- Configured status: ${isSupabaseConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED / PLACEHOLDER'}`);

  const result = await verifySupabaseConnection();

  console.log(`- Endpoint Reachable: ${result.reachable ? 'YES' : 'NO'}`);
  if (result.latencyMs !== undefined) {
    console.log(`- Latency: ${result.latencyMs}ms`);
  }
  console.log(`- Details: ${result.message}\n`);
}

runVerification().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
