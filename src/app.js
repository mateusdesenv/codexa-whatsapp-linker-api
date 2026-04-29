const express = require('express');
const cors = require('cors');
const dns = require('node:dns');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const leadRoutes = require('./routes/leadRoutes');
const leadCategoryRoutes = require('./routes/leadCategoryRoutes');
const leadStatusRoutes = require('./routes/leadStatusRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const configRoutes = require('./routes/configRoutes');
const authRequired = require('./middlewares/auth');
const databaseRequired = require('./middlewares/database');

// Força o uso de DNS públicos para evitar problemas de resolução em algumas redes.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (request, response) => {
  return response.status(200).json({
    data: {
      success: true,
      message: 'API Codexa WhatsApp Linker online.',
      baseUrl: '/api/v1',
      health: '/api/v1/health'
    }
  });
});

app.get('/api/v1', (request, response) => {
  return response.status(200).json({
    data: {
      success: true,
      message: 'API v1 online.',
      health: '/api/v1/health'
    }
  });
});

app.get('/api/v1/health', (request, response) => {
  return response.status(200).json({
    data: {
      success: true,
      status: 'online',
      app: 'Codexa WhatsApp Linker API',
      timestamp: new Date().toISOString()
    }
  });
});

// A partir daqui as rotas usam MongoDB. Em ambiente serverless, a conexão é aberta sob demanda e reutilizada.
app.use(databaseRequired);

// Mantém o CRUD simples de usuários criado anteriormente.
app.use('/api', userRoutes);

// API REST do WhatsApp Linker.
app.use('/api/v1', authRoutes);
app.use('/api/v1', authRequired, messageRoutes);
app.use('/api/v1', authRequired, leadRoutes);
app.use('/api/v1', authRequired, leadCategoryRoutes);
app.use('/api/v1', authRequired, leadStatusRoutes);
app.use('/api/v1', authRequired, whatsappRoutes);
app.use('/api/v1', authRequired, settingsRoutes);
app.use('/api/v1', authRequired, configRoutes);

app.use((request, response) => {
  return response.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Rota não encontrada.',
      requestId: `req_${Date.now().toString(36)}`
    }
  });
});

module.exports = app;
