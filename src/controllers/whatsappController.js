const { generateWaLink } = require('../utils/whatsapp');
const { success, validationError } = require('../utils/response');

async function createWhatsAppLink(request, response) {
  const { phone, message = '' } = request.body;
  if (!phone) return validationError(response, 'phone é obrigatório.');

  const result = generateWaLink(phone, message);
  return success(response, result);
}

module.exports = { createWhatsAppLink };
