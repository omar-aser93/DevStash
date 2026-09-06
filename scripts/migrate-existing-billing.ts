import 'dotenv/config'
import { migrateAllExistingStripeUsers, verifyBillingMigration } from '../lib/billing/migration';

async function main() {
  console.log('=== Step 1: Migrating Existing Stripe Users ===');
  const migrationResults = await migrateAllExistingStripeUsers();
  console.log(
    `Total found: ${migrationResults.total}, Successfully migrated: ${migrationResults.migrated}, Failed: ${migrationResults.failed}`
  );
  if (migrationResults.failed > 0) {
    console.warn('Failures:', migrationResults.results.filter((r) => r.status === 'failed'));
  }

  console.log('\n=== Step 2: Verifying Billing Migration Status ===');
  const report = await verifyBillingMigration();
  console.log(`Total users checked: ${report.totalUsers}`);
  console.log(`Legacy isPro = true users: ${report.legacyProUsers}`);
  console.log(`Active subscription users: ${report.activeSubscriptionUsers}`);
  console.log(`Mismatches found: ${report.mismatches.length}`);

  if (report.mismatches.length > 0) {
    console.log('\nMismatch details:');
    for (const m of report.mismatches) {
      console.log(
        `- User ${m.userId} (${m.email}): legacy isPro=${m.legacyIsPro}, activeSubscription=${m.hasActiveSubscription}, stripeSub=${m.stripeSubscriptionId}`
      );
    }
  } else {
    console.log('All user entitlement states are fully synchronized.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
