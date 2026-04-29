const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('A variável MONGODB_URI não foi definida no arquivo .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;
