/**
 * Migration Script: Add `date` field to expenses documents that are missing it.
 *
 * Strategy:
 *  - Read all documents from the `expenses` collection.
 *  - If a document already has a `date` field, SKIP it.
 *  - If not, set `date` from its `createdAt` field.
 *
 * Usage:
 *   node scripts/migrate-expenses-date.js
 *
 * Requirements:
 *   - FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 *     must be set in environment (or use Application Default Credentials).
 *   - Run from the neverbe-api directory: cd neverbe-api && node scripts/migrate-expenses-date.js
 */

require("dotenv").config({ path: ".env" });

const admin = require("firebase-admin");

// --- Init Firebase Admin ---
if (!admin.apps.length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const COLLECTION = "expenses";
const BATCH_SIZE = 400; // Firestore batch limit is 500

async function migrateExpensesDate() {
  console.log(`\n🚀 Starting migration for collection: "${COLLECTION}"`);

  const snapshot = await db.collection(COLLECTION).get();
  const total = snapshot.docs.length;
  console.log(`📦 Total documents found: ${total}`);

  let skipped = 0;
  let migrated = 0;
  let failed = 0;

  const docsToMigrate = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip documents that already have a `date` field
    if (data.date !== undefined && data.date !== null) {
      skipped++;
      continue;
    }

    // Determine the value to use for `date`
    if (!data.createdAt) {
      console.warn(`  ⚠️  Doc ${doc.id} has no createdAt either — skipping.`);
      skipped++;
      continue;
    }

    docsToMigrate.push({ ref: doc.ref, createdAt: data.createdAt });
  }

  console.log(`\n📝 Documents to migrate: ${docsToMigrate.length}`);
  console.log(`⏭️  Documents skipped (already have date): ${skipped}`);

  // Process in batches
  for (let i = 0; i < docsToMigrate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docsToMigrate.slice(i, i + BATCH_SIZE);

    for (const { ref, createdAt } of chunk) {
      try {
        batch.update(ref, { date: createdAt });
        migrated++;
      } catch (err) {
        console.error(`  ❌ Failed to stage update for ${ref.id}:`, err);
        failed++;
      }
    }

    await batch.commit();
    console.log(`  ✅ Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} docs)`);
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`   Migrated : ${migrated}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(`   Failed   : ${failed}`);
  console.log(`   Total    : ${total}`);
  process.exit(0);
}

migrateExpensesDate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
