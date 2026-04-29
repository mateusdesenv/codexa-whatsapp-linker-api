const User = require('../models/User');
const { sign, verify } = require('../utils/token');
const { success, error, serverError } = require('../utils/response');

const ACCESS_TOKEN_SECONDS = 60 * 60;
const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 30;

function buildTokenResponse(user) {
  const workspace = {
    id: user._id.toString(),
    name: user.nome || user.usuario || 'Workspace'
  };

  return {
    accessToken: sign({ userId: user._id.toString(), workspaceId: workspace.id, type: 'access' }, ACCESS_TOKEN_SECONDS),
    refreshToken: sign({ userId: user._id.toString(), workspaceId: workspace.id, type: 'refresh' }, REFRESH_TOKEN_SECONDS),
    expiresIn: ACCESS_TOKEN_SECONDS,
    user: {
      id: user._id.toString(),
      name: user.nome,
      email: user.usuario,
      usuario: user.usuario
    },
    workspace
  };
}

async function login(request, response) {
  try {
    const loginValue = request.body.email || request.body.usuario;
    const password = request.body.password || request.body.senha;

    if (!loginValue || !password) {
      return error(response, 422, 'VALIDATION_ERROR', 'Informe email/usuario e password/senha.');
    }

    const user = await User.findOne({ usuario: String(loginValue).toLowerCase() }).select('+senha');
    if (!user) {
      return error(response, 401, 'INVALID_CREDENTIALS', 'E-mail/usuário ou senha inválidos.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return error(response, 401, 'INVALID_CREDENTIALS', 'E-mail/usuário ou senha inválidos.');
    }

    return success(response, buildTokenResponse(user));
  } catch (err) {
    return serverError(response, err);
  }
}

async function refresh(request, response) {
  try {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      return error(response, 422, 'VALIDATION_ERROR', 'refreshToken é obrigatório.');
    }

    const payload = verify(refreshToken);
    if (payload.type !== 'refresh') {
      return error(response, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido.');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return error(response, 401, 'INVALID_REFRESH_TOKEN', 'Usuário não encontrado.');
    }

    return success(response, {
      accessToken: sign({ userId: user._id.toString(), workspaceId: payload.workspaceId || user._id.toString(), type: 'access' }, ACCESS_TOKEN_SECONDS),
      expiresIn: ACCESS_TOKEN_SECONDS
    });
  } catch (err) {
    return error(response, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido ou expirado.');
  }
}

async function logout(_request, response) {
  return success(response, { success: true });
}

async function me(request, response) {
  return success(response, {
    user: {
      id: request.auth.user._id.toString(),
      name: request.auth.user.nome,
      email: request.auth.user.usuario,
      usuario: request.auth.user.usuario
    },
    workspace: {
      id: request.auth.workspaceId.toString(),
      name: request.auth.user.nome || 'Codexa',
      role: 'owner'
    }
  });
}

module.exports = { login, refresh, logout, me };
