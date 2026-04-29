function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function generateWaLink(phone, message = '') {
  const phoneNormalized = normalizePhone(phone);
  const text = encodeURIComponent(message || '');
  const url = text ? `https://wa.me/${phoneNormalized}?text=${text}` : `https://wa.me/${phoneNormalized}`;
  return { phoneNormalized, url };
}

function interpolateMessage(template = '', lead = {}) {
  const values = {
    nome: lead.name || '',
    name: lead.name || '',
    telefone: lead.phone || '',
    phone: lead.phone || '',
    site: lead.website || '',
    website: lead.website || '',
    cidade: lead.city || '',
    city: lead.city || '',
    categoria: lead.category || lead.leadCategory || ''
  };

  return String(template || '').replace(/{{\s*([\w]+)\s*}}/g, (_, key) => values[key] || '');
}

module.exports = { normalizePhone, generateWaLink, interpolateMessage };
