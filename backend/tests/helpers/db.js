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

  // MongoDB cannot create a new collection inside a transaction.
  // Pre-creating every collection here ensures that transactional routes
  // (groupOwner, groupMain, bookReviews, etc.) never hit a missing
  // collection error ("Unable to write to collection due to catalog changes").
  const collectionNames = ['users', 'books', 'groups', 'reviews'];
  await Promise.all(
    collectionNames.map(async (name) => {
      try {
        await mongoose.connection.createCollection(name);
      } catch (e) {
        // Collection already exists — safe to ignore
        if (e.codeName !== 'NamespaceExists') throw e;
      }
    })
  );
}

async function disconnect() {
  try {
    await mongoose.disconnect();
  } catch (e) {
    // Ignore errors during disconnect — the connection may already
    // be closed if Jest ran suites in parallel.
  }
  if (replSet) {
    try {
      await replSet.stop();
    } catch (e) {
      // Ignore replica set stop errors during teardown
    }
  }
}

/** Wipe every collection between tests so state never bleeds across cases. */
async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connect, disconnect, clearCollections };
