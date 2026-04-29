const User = require('../models/User');
const { verify } = require('../utils/token');
const { error } = require('../utils/response');

async function authRequired(request, response, next) {
  try {
    const authorization = request.headers.authorization || '';
    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return error(response, 401, 'UNAUTHORIZED', 'Token de acesso não informado.');
    }

    const payload = verify(token);
    if (payload.type && payload.type !== 'access') {
      return error(response, 401, 'INVALID_TOKEN_TYPE', 'Use um access token válido.');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return error(response, 401, 'USER_NOT_FOUND', 'Usuário do token não existe mais.');
    }

    request.auth = {
      userId: user._id,
      workspaceId: payload.workspaceId || user._id,
      user
    };

    return next();
  } catch (err) {
    return error(response, 401, 'INVALID_TOKEN', err.message || 'Token inválido.');
  }
}

module.exports = authRequired;
