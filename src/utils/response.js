function success(response, data, statusCode = 200, meta) {
  const payload = { data };
  if (meta) payload.meta = meta;
  return response.status(statusCode).json(payload);
}

function error(response, statusCode, code, message, details = []) {
  return response.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId: `req_${Date.now().toString(36)}`
    }
  });
}

function notFound(response, message = 'Recurso não encontrado.') {
  return error(response, 404, 'NOT_FOUND', message);
}

function validationError(response, message = 'Erro de validação.', details = []) {
  return error(response, 422, 'VALIDATION_ERROR', message, details);
}

function serverError(response, err) {
  console.error(err);

  if (err && err.code === 11000) {
    return error(response, 409, 'DUPLICATED_VALUE', 'Já existe um registro com esses dados.');
  }

  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    return validationError(response, 'Erro de validação.', details);
  }

  if (err && err.name === 'CastError') {
    return error(response, 400, 'INVALID_ID', 'ID inválido.');
  }

  return error(response, 500, 'INTERNAL_SERVER_ERROR', 'Erro interno no servidor.');
}

module.exports = {
  success,
  error,
  notFound,
  validationError,
  serverError
};
