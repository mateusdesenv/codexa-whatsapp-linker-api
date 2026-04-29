const mongoose = require('mongoose');
const User = require('../models/User');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function handleMongoError(error, response) {
  if (error.code === 11000) {
    return response.status(409).json({
      success: false,
      message: 'Já existe um usuário cadastrado com esse nome de usuário.'
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message);
    return response.status(400).json({
      success: false,
      message: 'Erro de validação.',
      errors
    });
  }

  return response.status(500).json({
    success: false,
    message: 'Erro interno no servidor.'
  });
}

async function createUser(request, response) {
  try {
    const { nome, usuario, senha } = request.body;

    const user = await User.create({ nome, usuario, senha });

    return response.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso.',
      data: {
        id: user._id,
        nome: user.nome,
        usuario: user.usuario,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return handleMongoError(error, response);
  }
}

async function getUser(request, response) {
  try {
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      return response.status(400).json({
        success: false,
        message: 'ID inválido.'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return response.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    return response.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return handleMongoError(error, response);
  }
}

async function updateUser(request, response) {
  try {
    const { id } = request.params;
    const { nome, usuario, senha } = request.body;

    if (!isValidObjectId(id)) {
      return response.status(400).json({
        success: false,
        message: 'ID inválido.'
      });
    }

    const payload = {};
    if (nome !== undefined) payload.nome = nome;
    if (usuario !== undefined) payload.usuario = usuario;
    if (senha !== undefined) payload.senha = senha;

    const user = await User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return response.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    return response.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso.',
      data: user
    });
  } catch (error) {
    return handleMongoError(error, response);
  }
}

async function deleteUser(request, response) {
  try {
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      return response.status(400).json({
        success: false,
        message: 'ID inválido.'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return response.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    return response.status(200).json({
      success: true,
      message: 'Usuário deletado com sucesso.',
      data: {
        id: user._id,
        nome: user.nome,
        usuario: user.usuario
      }
    });
  } catch (error) {
    return handleMongoError(error, response);
  }
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser
};
