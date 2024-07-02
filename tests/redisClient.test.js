/* eslint-disable jest/no-hooks */
/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
const { expect } = require('chai');
const assert = require('assert');
const { describe, it, beforeEach } = require('mocha');

const redisClient = require('../utils/redis');

describe('redis client', () => {
  beforeEach(() => {
    redisClient.client.flushall();
  });

  after(() => {
    redisClient.client.quit();
  });

  it('isAlive', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('get (using await)', async () => {
    const key = 'myKey';
    const value = 'myValue';
    await redisClient.set(key, value, 20);
    const result = await redisClient.get(key);
    assert.equal(result, value);
  });

  it('set key and value (using await)', async () => {
    const key = 'myKey';
    const value = 'myValue';
    await redisClient.set(key, value, 20);
    const retrievedValue = await redisClient.get(key);
    assert.equal(value, retrievedValue);
  });

  it('check exist key (using await)', async () => {
    const key = 'myKey';
    const value = 'myValue';
    await redisClient.set(key, value, 20);
    const result = await redisClient.get(key);
    expect(result).to.equal(value);
  });

  it('delete key from redis', async () => {
    const key = 'myKey';
    const value = 'myValue';
    await redisClient.set(key, value, 20);
    await redisClient.del(key);
    const result = await redisClient.get(key);
    expect(result).to.equal(null);
  });
});
