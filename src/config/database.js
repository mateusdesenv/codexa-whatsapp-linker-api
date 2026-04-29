const mongoose = require('mongoose');

let connectionPromise = null;

async function connectDatabase() {
  let mongoDbUri = 'mongodb+srv://mateus_db_user:1908@cluster0.ue2kkz4.mongodb.net/codexa-whatsapp-linker?retryWrites=true&w=majority';
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (mongoDbUri) {
    throw new Error('A variável MONGODB_URI não foi definida. Configure no .env local ou nas Environment Variables da Vercel.');
  }

  connectionPromise = mongoose
    .connect(mongoDbUri, {
      serverSelectionTimeoutMS: 10000
    })
    .then(() => {
      console.log('MongoDB conectado com sucesso.');
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
}

module.exports = connectDatabase;
