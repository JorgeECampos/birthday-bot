const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const { MongoClient } = require('mongodb');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Servidor Express para mantener vivo el servicio
app.get('/', (req, res) => {
  res.send('Bot activo');
});

app.listen(port, () => {
  console.log(`Servidor web escuchando en puerto ${port}`);
});

// WhatsApp Web Client
const client = new Client({
  authStrategy: new LocalAuth()
});

// MongoDB URI desde variable de entorno
const uri = process.env.MONGODB_URI;
const clientDB = new MongoClient(uri);

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('Autenticado con WhatsApp');
});

client.on('auth_failure', msg => {
  console.error('Fallo autenticación:', msg);
});

client.on('disconnected', reason => {
  console.log('Cliente desconectado:', reason);
});

async function getContacts() {
  try {
    await clientDB.connect();
    const collection = clientDB.db('birthdayBot').collection('contacts');
    const contacts = await collection.find({}).toArray();
    return contacts;
  } catch (error) {
    console.error('Error obteniendo contactos de la base de datos:', error);
    return [];
  }
  // No cerramos la conexión para mantenerla viva mientras dure el bot
}

async function checkBirthdaysAndSendMessages() {
  const contacts = await getContacts();

  const today = new Date();
  const monthDay = ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);

  for (const contact of contacts) {
    if (contact.birthday === monthDay) {
      const chatId = contact.number + '@c.us';
      const message = `¡Feliz cumpleaños, ${contact.name}! 🎉🎂 Espero que tengas un día increíble.`;
      try {
        await client.sendMessage(chatId, message);
        console.log(`Mensaje enviado a ${contact.name}`);
      } catch (err) {
        console.error(`Error enviando a ${contact.name}:`, err);
      }
    }
  }
}

client.on('ready', () => {
  console.log('Cliente listo!');
  checkBirthdaysAndSendMessages(); // Ejecuta al iniciar
  schedule.scheduleJob('0 9 * * *', () => {
    checkBirthdaysAndSendMessages();
  });
});

client.initialize();
