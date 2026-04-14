/**
 * MongoDB in-memory replica set helpers.
 *
 * We use MongoMemoryReplSet (not MongoMemoryServer) because many routes
 * call mongoose.startSession() / session transactions, which require a
 * replica set.
 *
 * Usage in every test file:
 *
 *   const db = require('./helpers/db');
 *   beforeAll(db.connect);
 *   afterEach(db.clearCollections);
 *   afterAll(db.disconnect);
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

async function connect() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
}

async function disconnect() {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}

// Wipe every collection between tests so state never bleeds across cases.
async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connect, disconnect, clearCollections };
