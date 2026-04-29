const connectDatabase = require('../config/database');

async function databaseRequired(request, response, next) {
  try {
    await connectDatabase();
    return next();
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error.message);

    return response.status(500).json({
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Não foi possível conectar ao MongoDB. Verifique a variável MONGODB_URI nas Environment Variables da Vercel.',
        requestId: `req_${Date.now().toString(36)}`
      }
    });
  }
}

module.exports = databaseRequired;
