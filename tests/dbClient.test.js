/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/no-hooks */
const { v4: uuidv4 } = require('uuid');
const { expect } = require('chai');
const {
  before, beforeEach, it, describe,
} = require('mocha');
const dbClient = require('../utils/db');

describe('db client', () => {
  const users = [
    { email: `${uuidv4()}@gmail.com`, password: uuidv4() },
    { email: `${uuidv4()}@gmail.com`, password: uuidv4() },
  ];

  const files = [
    {
      name: uuidv4(), type: 'folder', isPublic: true, parentId: 0, userId: 0,
    },
    {
      name: uuidv4(), type: 'folder', isPublic: true, parentId: 0, userId: 0,
    },
  ];

  const db = dbClient.client.db(dbClient.database);
  const usersCollection = db.collection('users');
  const filesCollection = db.collection('files');

  before(async () => {
    if (!await dbClient.isAlive()) {
      throw new Error('Database client is not alive');
    }
  });

  beforeEach(async () => {
    await usersCollection.deleteMany({});
    await filesCollection.deleteMany({});
    await usersCollection.insertMany(users);
    await filesCollection.insertMany(files);
  });

  it('should verify the database client is alive', async () => {
    let assertionCount = 0;
    const result = await dbClient.isAlive();
    expect(result).to.equal(true);
    assertionCount += 1;
    expect(assertionCount).to.equal(1);
  });

  it('should count the correct number of users', async () => {
    let assertionCount = 0;
    const result = await dbClient.nbUsers();
    expect(result).to.equal(users.length);
    assertionCount += 1;
    expect(assertionCount).to.equal(1);
  });

  it('should count the correct number of files', async () => {
    let assertionCount = 0;
    const result = await dbClient.nbFiles();
    expect(result).to.equal(files.length);
    assertionCount += 1;
    expect(assertionCount).to.equal(1);
  });
});
