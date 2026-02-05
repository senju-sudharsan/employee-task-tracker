import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Absolute path to serviceAccountKey.json
const serviceAccountPath = path.resolve(
  process.cwd(),
  "serviceAccountKey.json"
);

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// test
console.log("🔥 Firebase Admin initialized successfully");


async function normalizeTasks() {
  const snap = await db.collection("tasks").get();

  if (snap.empty) {
    console.log("⚠️ No tasks found");
    return;
  }

  let fixedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};

    if (!("deadline" in data)) {
      updates.deadline = null;
    }

    if (!("completedAt" in data)) {
      updates.completedAt = null;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      fixedCount++;
      console.log(`✅ Fixed task ${doc.id}`);
    }
  }

  console.log(`🎉 Task normalization complete (${fixedCount} updated)`);
}

normalizeTasks().catch(console.error);
