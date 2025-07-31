const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

async function checkDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get database info
    const db = mongoose.connection.db;
    console.log(`\n=== DATABASE INFO ===`);
    console.log(`Database name: ${db.databaseName}`);
    console.log(`Database host: ${mongoose.connection.host}`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n=== COLLECTIONS ===`);
    console.log(`Total collections: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check each collection for documents
    console.log(`\n=== COLLECTION CONTENTS ===`);
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
      
      if (count > 0 && count <= 5) {
        // Show sample documents for small collections
        const sample = await db.collection(collection.name).find().limit(1).toArray();
        if (sample.length > 0) {
          console.log(`    Sample document keys: ${Object.keys(sample[0]).join(', ')}`);
        }
      }
    }

    // Try to find departments in any collection
    console.log(`\n=== SEARCHING FOR DEPARTMENTS ===`);
    for (const collection of collections) {
      const deptCount = await db.collection(collection.name).countDocuments({ name: { $regex: /department/i } });
      if (deptCount > 0) {
        console.log(`  Found ${deptCount} department-like documents in ${collection.name}`);
      }
      
      const deptDocs = await db.collection(collection.name).find({ 
        $or: [
          { name: { $regex: /department/i } },
          { code: { $regex: /CS|IT|EC|ME|CE/i } }
        ]
      }).limit(3).toArray();
      
      if (deptDocs.length > 0) {
        console.log(`  Sample department documents in ${collection.name}:`);
        deptDocs.forEach(doc => {
          console.log(`    - ${doc.name || doc.code || 'Unknown'}: ${doc._id}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Check database failed:', error);
    process.exit(1);
  }
}

checkDatabase(); 