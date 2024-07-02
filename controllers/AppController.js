const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static async getStatus (req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = await dbClient.isAlive();
    return res.status(200).send({ redis: redisStatus, db: dbStatus });
  }

  static async getStats (req, res) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles()
    };
    return res.status(200).send(stats);
  }
}

module.exports = AppController;
