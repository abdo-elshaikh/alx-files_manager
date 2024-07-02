const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
    }
    const db = dbClient.client.db(dbClient.database);
    const userExist = await db.collection('users').findOne({ email });

    if (userExist) {
      res.status(400).send({ error: 'Already exist' });
    }
    const hashPassword = sha1(password);
    const newUser = {
      email,
      password: hashPassword
    };

    try {
      const result = await db.collection('users').insertOne(newUser);
      const { _id } = result.insertedId;

      res.status(201).send({ id: _id, email });
    } catch (err) {
      console.error('can\'t add new user:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
  }

  static async getMe (req, res) {
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.getUserFromToken(token);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
