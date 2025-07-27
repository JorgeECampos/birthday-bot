require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function testConnection() {
  const clientDB = new MongoClient(uri);
  try {
    await clientDB.connect();
    console.log('Conectado a MongoDB Atlas');
    const collection = clientDB.db('birthdayBot').collection('contacts');
    const contacts = await collection.find({}).toArray();
    console.log('Contactos encontrados:', contacts);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await clientDB.close();
  }
}

testConnection();
