const { MongoClient } = require('mongodb');

class DBClient {
  constructor () {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}/`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client.connect().catch(console.error);
  }

  async isAlive () {
    try {
      await this.client.db(this.database).command({ ping: 1 });
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
      return false;
    }
  }

  async nbUsers () {
    try {
      const db = this.client.db(this.database);
      const count = await db.collection('users').countDocuments();
      return count;
    } catch (error) {
      console.error('Failed to count users', error);
      throw error;
    }
  }

  async nbFiles () {
    try {
      const db = this.client.db(this.database);
      const count = await db.collection('files').countDocuments();
      return count;
    } catch (error) {
      console.error('Failed to count files', error);
      throw error;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
