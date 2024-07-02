const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect (req, res) {
    const auth = req.get('Authorization');
    if (!auth) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const creds = buff.toString('utf-8');
    const [email, password] = creds.split(':');

    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const db = dbClient.client.db(dbClient.database);
    const user = await db.collection('users').findOne({ email });

    if (!user || user.password !== sha1(password)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect (req, res) {
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    await redisClient.del(key);
    return res.status(204).end();
  }
}

module.exports = AuthController;
