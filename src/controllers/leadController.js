const Lead = require('../models/Lead');
const LeadStatus = require('../models/LeadStatus');
const LeadCategory = require('../models/LeadCategory');
const LeadInteraction = require('../models/LeadInteraction');
const { ensureDefaultStatuses } = require('./leadStatusController');
const { ensureDefaultCategories } = require('./leadCategoryController');
const { success, notFound, validationError, error, serverError } = require('../utils/response');
const { parsePagination, parseSort, boolFromQuery } = require('../utils/query');
const { generateWaLink, interpolateMessage } = require('../utils/whatsapp');

function buildLeadFilter(request) {
  const filter = { workspaceId: request.auth.workspaceId };
  const andConditions = [];
  const { search, status, leadCategory, city, state } = request.query;
  const hasCategory = boolFromQuery(request.query.hasCategory);
  const hasWebsite = boolFromQuery(request.query.hasWebsite);

  if (search) {
    andConditions.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { leadCategory: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ]
    });
  }

  if (status) filter.status = status;
  if (leadCategory) filter.leadCategory = leadCategory;
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (state) filter.state = { $regex: state, $options: 'i' };

  if (hasCategory === true) filter.leadCategory = { $nin: ['', null] };
  if (hasCategory === false) {
    andConditions.push({ $or: [{ leadCategory: '' }, { leadCategory: null }, { leadCategory: { $exists: false } }] });
  }

  if (hasWebsite === true) filter.website = { $nin: ['', null] };
  if (hasWebsite === false) {
    andConditions.push({ $or: [{ website: '' }, { website: null }, { website: { $exists: false } }] });
  }

  if (andConditions.length) filter.$and = andConditions;
  return filter;
}

function normalizeLeadPayload(input = {}) {
  const get = (...keys) => {
    for (const key of keys) {
      if (input[key] !== undefined && input[key] !== null) return input[key];
    }
    return undefined;
  };

  return {
    name: get('name', 'nome', 'title', 'empresa') || '',
    phone: get('phone', 'telefone', 'whatsapp', 'celular') || '',
    website: get('website', 'site', 'urlSite', 'url', 'link') || '',
    street: get('street', 'endereco', 'rua', 'address') || '',
    city: get('city', 'cidade') || '',
    state: get('state', 'estado', 'uf') || '',
    countryCode: get('countryCode', 'pais', 'country') || 'BR',
    category: get('category', 'categoria', 'tipo') || '',
    leadCategory: get('leadCategory', 'categoriaLead', 'classificacao') || '',
    categories: Array.isArray(get('categories', 'categorias')) ? get('categories', 'categorias') : [],
    mapsUrl: get('mapsUrl', 'googleMapsUrl', 'maps', 'mapa') || '',
    totalScore: get('totalScore', 'rating', 'nota') ?? null,
    reviewsCount: get('reviewsCount', 'avaliacoes', 'reviews') ?? null,
    status: get('status') || 'Novo',
    notes: get('notes', 'observacoes', 'notas') || '',
    source: get('source', 'origem') || 'Importação manual'
  };
}

function extractRecords(body) {
  if (Array.isArray(body)) return body;
  const keys = ['records', 'leads', 'items', 'data', 'results', 'empresas', 'clinicas'];
  for (const key of keys) {
    if (Array.isArray(body[key])) return body[key];
  }
  return null;
}

function leadHasMinimum(payload) {
  return Boolean(payload.name || payload.phone || payload.website);
}

async function findDuplicateLead(workspaceId, payload) {
  const filters = [];
  if (payload.mapsUrl) filters.push({ workspaceId, mapsUrl: payload.mapsUrl });
  if (payload.name && payload.phone) filters.push({ workspaceId, name: payload.name, phone: payload.phone });
  if (payload.name && payload.website) filters.push({ workspaceId, name: payload.name, website: payload.website });
  if (payload.name && payload.city) filters.push({ workspaceId, name: payload.name, city: payload.city });

  if (!filters.length) return null;
  return Lead.findOne({ $or: filters });
}

async function listLeads(request, response) {
  try {
    const filter = buildLeadFilter(request);
    const { page, perPage, skip } = parsePagination(request.query);
    const sort = parseSort(request.query.sort || 'updatedAt:desc');

    const [items, total] = await Promise.all([
      Lead.find(filter).sort(sort).skip(skip).limit(perPage),
      Lead.countDocuments(filter)
    ]);

    return success(response, items, 200, {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage) || 1
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function getLeadStats(request, response) {
  try {
    const filter = buildLeadFilter(request);
    const [total, newCount, contacted, withWebsite, withoutWebsite, byStatus, byLeadCategory] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, status: 'Novo' }),
      Lead.countDocuments({ ...filter, status: 'Contato feito' }),
      Lead.countDocuments({ ...filter, website: { $nin: ['', null] } }),
      Lead.countDocuments({ ...filter, $or: [{ website: '' }, { website: null }, { website: { $exists: false } }] }),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$status', total: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', total: 1 } },
        { $sort: { total: -1 } }
      ]),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$leadCategory', total: { $sum: 1 } } },
        { $project: { _id: 0, leadCategory: '$_id', total: 1 } },
        { $sort: { total: -1 } }
      ])
    ]);

    return success(response, {
      total,
      new: newCount,
      contacted,
      withWebsite,
      withoutWebsite,
      byStatus,
      byLeadCategory
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function createLead(request, response) {
  try {
    await ensureDefaultStatuses(request.auth.workspaceId);
    const payload = normalizeLeadPayload(request.body);
    if (!leadHasMinimum(payload)) {
      return validationError(response, 'Preencha pelo menos nome, telefone ou site do lead.');
    }

    const lead = await Lead.create({ ...payload, workspaceId: request.auth.workspaceId });
    return success(response, lead, 201);
  } catch (err) {
    return serverError(response, err);
  }
}

async function importLeads(request, response) {
  try {
    const records = extractRecords(request.body);
    if (!records) return error(response, 400, 'INVALID_IMPORT_FORMAT', 'Arquivo não contém lista de leads.');

    const mergeStrategy = request.body.mergeStrategy || 'upsert';
    const result = { total: records.length, created: 0, updated: 0, ignored: 0, duplicates: [] };

    for (const [index, record] of records.entries()) {
      const payload = normalizeLeadPayload(record);
      if (!leadHasMinimum(payload)) {
        result.ignored += 1;
        continue;
      }

      const duplicate = await findDuplicateLead(request.auth.workspaceId, payload);
      if (duplicate) {
        result.duplicates.push({ recordIndex: index, matchedLeadId: duplicate.id, reason: 'duplicateDetected' });
        if (mergeStrategy === 'upsert' || mergeStrategy === 'merge') {
          Object.assign(duplicate, payload);
          await duplicate.save();
          result.updated += 1;
        } else {
          result.ignored += 1;
        }
        continue;
      }

      await Lead.create({ ...payload, workspaceId: request.auth.workspaceId, source: payload.source || 'Arquivo importado' });
      result.created += 1;
    }

    return success(response, result);
  } catch (err) {
    return serverError(response, err);
  }
}

async function exportLeads(request, response) {
  try {
    const filter = buildLeadFilter(request);
    const items = await Lead.find(filter).sort(parseSort(request.query.sort || 'updatedAt:desc'));
    return success(response, items, 200, {
      exportedAt: new Date().toISOString(),
      total: items.length
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function getLead(request, response) {
  try {
    const lead = await Lead.findOne({ _id: request.params.leadId, workspaceId: request.auth.workspaceId });
    if (!lead) return notFound(response, 'Lead não encontrado.');
    return success(response, lead);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateLead(request, response) {
  try {
    const payload = normalizeLeadPayload(request.body);
    const lead = await Lead.findOneAndUpdate(
      { _id: request.params.leadId, workspaceId: request.auth.workspaceId },
      payload,
      { new: true, runValidators: true }
    );
    if (!lead) return notFound(response, 'Lead não encontrado.');
    return success(response, lead);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateLeadStatus(request, response) {
  try {
    await ensureDefaultStatuses(request.auth.workspaceId);
    const { status } = request.body;
    if (!status) return validationError(response, 'status é obrigatório.');

    const statusExists = await LeadStatus.exists({ workspaceId: request.auth.workspaceId, name: status });
    if (!statusExists) return error(response, 400, 'INVALID_STATUS', 'Status não existe em leadStatuses.');

    const lead = await Lead.findOneAndUpdate(
      { _id: request.params.leadId, workspaceId: request.auth.workspaceId },
      { status },
      { new: true }
    );
    if (!lead) return notFound(response, 'Lead não encontrado.');

    return success(response, { id: lead.id, status: lead.status, updatedAt: lead.updatedAt });
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateLeadCategory(request, response) {
  try {
    await ensureDefaultCategories(request.auth.workspaceId);
    const { leadCategory } = request.body;

    if (leadCategory) {
      const exists = await LeadCategory.exists({ workspaceId: request.auth.workspaceId, name: leadCategory });
      if (!exists) return error(response, 400, 'INVALID_CATEGORY', 'Categoria não existe em leadCategories.');
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: request.params.leadId, workspaceId: request.auth.workspaceId },
      { leadCategory: leadCategory || '' },
      { new: true }
    );
    if (!lead) return notFound(response, 'Lead não encontrado.');

    return success(response, { id: lead.id, leadCategory: lead.leadCategory, updatedAt: lead.updatedAt });
  } catch (err) {
    return serverError(response, err);
  }
}

async function deleteLead(request, response) {
  try {
    const lead = await Lead.findOneAndDelete({ _id: request.params.leadId, workspaceId: request.auth.workspaceId });
    if (!lead) return notFound(response, 'Lead não encontrado.');
    return success(response, { success: true });
  } catch (err) {
    return serverError(response, err);
  }
}

async function deleteAllLeads(request, response) {
  try {
    if (request.body.confirm !== 'DELETE_ALL_LEADS') {
      return error(response, 400, 'CONFIRMATION_REQUIRED', 'Campo confirm obrigatório.');
    }
    const result = await Lead.deleteMany({ workspaceId: request.auth.workspaceId });
    return success(response, { success: true, deleted: result.deletedCount || 0 });
  } catch (err) {
    return serverError(response, err);
  }
}

async function generateLeadWhatsAppLink(request, response) {
  try {
    const lead = await Lead.findOne({ _id: request.params.leadId, workspaceId: request.auth.workspaceId });
    if (!lead) return notFound(response, 'Lead não encontrado.');
    if (!lead.phone) return validationError(response, 'Lead não possui telefone.');

    const category = lead.leadCategory
      ? await LeadCategory.findOne({ workspaceId: request.auth.workspaceId, name: lead.leadCategory })
      : null;

    const template = request.body.messageOverride || (category && category.message) || '';
    const message = interpolateMessage(template, lead);
    const link = generateWaLink(lead.phone, message);

    return success(response, {
      leadId: lead.id,
      phoneNormalized: link.phoneNormalized,
      message,
      url: link.url,
      categoryMessageUsed: category ? category.name : null
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function createLeadInteraction(request, response) {
  try {
    const lead = await Lead.findOne({ _id: request.params.leadId, workspaceId: request.auth.workspaceId });
    if (!lead) return notFound(response, 'Lead não encontrado.');

    const interaction = await LeadInteraction.create({
      workspaceId: request.auth.workspaceId,
      leadId: lead._id,
      type: request.body.type || 'whatsapp_message_opened',
      sent: Boolean(request.body.sent),
      statusAfterSend: request.body.statusAfterSend || '',
      message: request.body.message || '',
      notes: request.body.notes || ''
    });

    if (request.body.statusAfterSend) {
      lead.status = request.body.statusAfterSend;
      await lead.save();
    }

    return success(response, interaction, 201);
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = {
  buildLeadFilter,
  normalizeLeadPayload,
  listLeads,
  getLeadStats,
  createLead,
  importLeads,
  exportLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  updateLeadCategory,
  deleteLead,
  deleteAllLeads,
  generateLeadWhatsAppLink,
  createLeadInteraction
};
