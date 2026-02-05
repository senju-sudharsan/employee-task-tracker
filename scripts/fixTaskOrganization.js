import admin from "firebase-admin";
import fs from "fs";

// 🔐 load service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔥 THIS IS YOUR REAL ORG ID
const CORRECT_ORG_ID = "SPSqBwa8NkDRFz0sIttF";

async function fixTasks() {
  const snap = await db.collection("tasks").get();

  let fixed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // fix missing or wrong orgId
    if (!data.organizationId || data.organizationId !== CORRECT_ORG_ID) {
      await doc.ref.update({
        organizationId: CORRECT_ORG_ID
      });
      fixed++;
      console.log(`✅ Fixed task ${doc.id}`);
    }
  }

  console.log(`🎉 Done. Updated ${fixed} tasks.`);
  process.exit(0);
}

fixTasks();
