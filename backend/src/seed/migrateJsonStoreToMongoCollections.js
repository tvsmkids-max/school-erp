import dotenv from "dotenv";
import mongoose from "mongoose";
import { nativeCollections } from "../models/nativeModels.js";

dotenv.config();

const JSON_STORE_COLLECTION = "erp_json_store";
const JSON_STORE_KEY = "main";

const collectionsToMigrate = [
  "tenants",
  "branches",
  "permissions",
  "roles",
  "users",
  "user_sessions",
  "academic_sessions",
  "classes",
  "sections",
  "students",
  "student_field_configs",
  "attendance_records",
  "activity_logs",
  "student_import_batches",
  "backup_history",
];

const normalizeRecord = (record) => {
  const cleanRecord = { ...record };

  if (!cleanRecord._id) {
    throw new Error("Record missing _id");
  }

  delete cleanRecord.__v;

  return cleanRecord;
};

const migrateCollection = async ({ collectionName, records }) => {
  const Model = nativeCollections[collectionName];

  if (!Model) {
    console.log(`SKIP ${collectionName}: no native model`);
    return {
      collectionName,
      total: records.length,
      upserted: 0,
      skipped: records.length,
    };
  }

  let upserted = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const cleanRecord = normalizeRecord(record);

      await Model.updateOne(
        { _id: cleanRecord._id },
        { $set: cleanRecord },
        { upsert: true, strict: false },
      );

      upserted += 1;
    } catch (error) {
      skipped += 1;
      console.log(
        `SKIP ${collectionName}/${record?._id || "unknown"}: ${error.message}`,
      );
    }
  }

  return {
    collectionName,
    total: records.length,
    upserted,
    skipped,
  };
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log(
    `Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );

  const jsonStore = mongoose.connection.db.collection(JSON_STORE_COLLECTION);
  const storeDoc = await jsonStore.findOne({ key: JSON_STORE_KEY });

  if (!storeDoc?.db) {
    throw new Error(
      "No erp_json_store main document found. Run seeds/import data first.",
    );
  }

  const db = storeDoc.db;
  const results = [];

  for (const collectionName of collectionsToMigrate) {
    const records = Array.isArray(db[collectionName]) ? db[collectionName] : [];

    const result = await migrateCollection({
      collectionName,
      records,
    });

    results.push(result);

    console.log(
      `${result.collectionName}: total=${result.total}, upserted=${result.upserted}, skipped=${result.skipped}`,
    );
  }

  await mongoose.connection.db.collection("migration_history").insertOne({
    type: "json_store_to_native_collections",
    sourceCollection: JSON_STORE_COLLECTION,
    sourceKey: JSON_STORE_KEY,
    results,
    createdAt: new Date(),
  });

  console.log("Migration completed successfully.");
  console.log("Native collections are now available in MongoDB Atlas.");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(`Migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
