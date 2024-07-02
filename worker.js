const Queue = require('bull');
const fs = require('fs');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  const db = dbClient.client.db(dbClient.database);

  const file = await db.collection('files').findOne({ fileId });
  if (!file) {
    throw new Error('File not found');
  }

  const filePath = file.localpath;

  try {
    const thumbnails = await Promise.all([
      imageThumbnail(filePath, { width: 500 }),
      imageThumbnail(filePath, { width: 250 }),
      imageThumbnail(filePath, { width: 100 }),
    ]);

    thumbnails.forEach((thumbnail, index) => {
      const resizedFilePath = `${filePath
        .slice(0, -path.extname(filePath).length)}_${index + 1}${path.extname(filePath)}`;
      fs.writeFile(resizedFilePath, thumbnail);
    });

    console.log('Thumbnails generated successfully for file:', fileId);
  } catch (error) {
    console.error('Error generating thumbnails:', error);
  }
});
