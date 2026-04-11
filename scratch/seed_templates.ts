import { getSMSTemplates } from "./src/services/TemplateService";
import { adminFirestore } from "./src/firebase/firebaseAdmin";

async function seed() {
  try {
    console.log("Checking SMS templates in database...");
    const result = await getSMSTemplates();
    console.log(`Seeding complete. ${result.data?.length || 0} templates are now in the database.`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
