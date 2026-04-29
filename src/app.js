const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (request, response) => {
  return response.status(200).json({
    success: true,
    message: 'API Codexa User CRUD online.'
  });
});

// Força o uso do DNS do Google

app.use('/api', userRoutes);

app.use((request, response) => {
  return response.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

module.exports = app;
