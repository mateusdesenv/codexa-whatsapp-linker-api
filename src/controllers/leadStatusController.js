const LeadStatus = require('../models/LeadStatus');
const Lead = require('../models/Lead');
const { DEFAULT_LEAD_STATUSES } = require('../utils/defaults');
const { success, notFound, validationError, error, serverError } = require('../utils/response');

async function ensureDefaultStatuses(workspaceId) {
  const count = await LeadStatus.countDocuments({ workspaceId });
  if (count === 0) {
    await LeadStatus.insertMany(DEFAULT_LEAD_STATUSES.map((item) => ({ ...item, workspaceId })));
  }
}

async function attachUsageCount(statuses, workspaceId) {
  return Promise.all(statuses.map(async (status) => {
    const usageCount = await Lead.countDocuments({ workspaceId, status: status.name });
    const json = status.toJSON();
    json.usageCount = usageCount;
    return json;
  }));
}

async function listLeadStatuses(request, response) {
  try {
    await ensureDefaultStatuses(request.auth.workspaceId);
    const filter = { workspaceId: request.auth.workspaceId };
    if (request.query.search) filter.name = { $regex: request.query.search, $options: 'i' };

    const statuses = await LeadStatus.find(filter).sort({ position: 1, createdAt: 1 });
    return success(response, await attachUsageCount(statuses, request.auth.workspaceId));
  } catch (err) {
    return serverError(response, err);
  }
}

async function createLeadStatus(request, response) {
  try {
    if (!request.body.name) return validationError(response, 'name é obrigatório.');

    const last = await LeadStatus.findOne({ workspaceId: request.auth.workspaceId }).sort({ position: -1 });
    const status = await LeadStatus.create({
      workspaceId: request.auth.workspaceId,
      name: request.body.name,
      description: request.body.description || '',
      position: request.body.position || ((last && last.position ? last.position : 0) + 1)
    });

    const json = status.toJSON();
    json.usageCount = 0;
    return success(response, json, 201);
  } catch (err) {
    if (err.code === 11000) return error(response, 409, 'STATUS_NAME_EXISTS', 'Já existe status com esse nome.');
    return serverError(response, err);
  }
}

async function getLeadStatus(request, response) {
  try {
    const status = await LeadStatus.findOne({ _id: request.params.statusId, workspaceId: request.auth.workspaceId });
    if (!status) return notFound(response, 'Status não encontrado.');
    const [json] = await attachUsageCount([status], request.auth.workspaceId);
    return success(response, json);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateLeadStatus(request, response) {
  try {
    const current = await LeadStatus.findOne({ _id: request.params.statusId, workspaceId: request.auth.workspaceId });
    if (!current) return notFound(response, 'Status não encontrado.');

    const oldName = current.name;
    ['name', 'description', 'position'].forEach((field) => {
      if (request.body[field] !== undefined) current[field] = request.body[field];
    });
    await current.save();

    let updatedLeads = 0;
    if (request.body.name && request.body.name !== oldName) {
      const result = await Lead.updateMany(
        { workspaceId: request.auth.workspaceId, status: oldName },
        { status: request.body.name }
      );
      updatedLeads = result.modifiedCount || 0;
    }

    return success(response, {
      id: current.id,
      name: current.name,
      description: current.description,
      position: current.position,
      updatedLeads,
      updatedAt: current.updatedAt
    });
  } catch (err) {
    if (err.code === 11000) return error(response, 409, 'STATUS_NAME_EXISTS', 'Já existe status com esse nome.');
    return serverError(response, err);
  }
}

async function deleteLeadStatus(request, response) {
  try {
    await ensureDefaultStatuses(request.auth.workspaceId);
    const totalStatuses = await LeadStatus.countDocuments({ workspaceId: request.auth.workspaceId });
    if (totalStatuses <= 1) {
      return error(response, 400, 'LAST_STATUS_CANNOT_BE_DELETED', 'Mantenha pelo menos um status cadastrado.');
    }

    const status = await LeadStatus.findOne({ _id: request.params.statusId, workspaceId: request.auth.workspaceId });
    if (!status) return notFound(response, 'Status não encontrado.');

    let fallback = null;
    if (request.body.fallbackStatusId) {
      fallback = await LeadStatus.findOne({ _id: request.body.fallbackStatusId, workspaceId: request.auth.workspaceId });
    }
    if (!fallback) {
      fallback = await LeadStatus.findOne({ workspaceId: request.auth.workspaceId, _id: { $ne: status._id } }).sort({ position: 1 });
    }

    await status.deleteOne();
    const result = await Lead.updateMany(
      { workspaceId: request.auth.workspaceId, status: status.name },
      { status: fallback.name }
    );

    return success(response, {
      success: true,
      fallbackStatus: fallback.name,
      updatedLeads: result.modifiedCount || 0
    });
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = {
  ensureDefaultStatuses,
  listLeadStatuses,
  createLeadStatus,
  getLeadStatus,
  updateLeadStatus,
  deleteLeadStatus
};
