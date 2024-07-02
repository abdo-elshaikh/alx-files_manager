const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { mime } = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data
    } = req.body;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    const db = dbClient.client.db(dbClient.database);

    if (parentId !== '0') {
      const parent = await db.collection('files').findOne({ _id: parentId });
      if (!parent) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    let filePath;

    if (type !== 'folder') {
      const buff = Buffer.from(data, 'base64');
      const fileId = uuidv4();
      filePath = path.join(FOLDER_PATH, fileId);
      try {
        fs.writeFileSync(filePath, buff);
      } catch (error) {
        return res.status(500).send({ error: 'Cannot write to the file' });
      }
    }

    const file = {
      id: uuidv4(),
      userId,
      name,
      type,
      parentId,
      isPublic,
      localPath: type !== 'folder' ? filePath : null,
    };

    try {
      const result = await db.collection('files').insertOne(file);
      const { insertedId } = result;
      return res.status(201).send({ id: insertedId, ...file });
    } catch (err) {
      console.error('Cannot create file:', err);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  static async getShow (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }

    const db = dbClient.client.db(dbClient.database);
    const file = await db.collection('files').findOne({ _id: fileId });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.userId !== userId && !file.isPublic) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    return res.status(200).send(file);
  }

  static async getIndex (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const parentId = req.query.parent || '0';
    const page = req.query.page || 0;
    const limit = req.query.limit || 20;

    const db = dbClient.client.db(dbClient.database);
    const files = await db.collection('files').find({ parentId, userId }).skip(page * limit).limit(limit)
      .toArray();

    return res.status(200).send(files);
  }

  static async putPublish (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }

    const db = dbClient.client.db(dbClient.database);
    const file = await db.collection('files').findOne({ _id: fileId });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.userId !== userId) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    const result = await db.collection('files').updateOne({ _id: fileId }, { $set: { isPublic: true } });

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.status(200).send({ id: fileId, isPublic: true });
  }

  static async putUnpublish (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }

    const db = dbClient.client.db(dbClient.database);
    const file = await db.collection('files').findOne({ _id: fileId });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.userId !== userId) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    const result = await db.collection('files').updateOne({ _id: fileId }, { $set: { isPublic: false } });

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.status(200).send({ id: fileId, isPublic: false });
  }

  static async getFile (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }

    const db = dbClient.client.db(dbClient.database);
    const file = await db.collection('files').findOne({ _id: fileId });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.userId !== userId && !file.isPublic) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).send({ error: 'A folder doesn\'t have data' });
    }

    try {
      const data = fs.readFileSync(file.localPath);
      const mimeType = mime.lookup(file.localPath);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(data);
    } catch (err) {
      return res.status(500).send({ error: 'Cannot load the file' });
    }
  }
}

module.exports = FilesController;
