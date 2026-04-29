const LeadCategory = require('../models/LeadCategory');
const Lead = require('../models/Lead');
const { DEFAULT_LEAD_CATEGORIES } = require('../utils/defaults');
const { success, notFound, validationError, error, serverError } = require('../utils/response');

async function ensureDefaultCategories(workspaceId) {
  const count = await LeadCategory.countDocuments({ workspaceId });
  if (count === 0) {
    await LeadCategory.insertMany(DEFAULT_LEAD_CATEGORIES.map((item) => ({ ...item, workspaceId })));
  }
}

async function attachUsageCount(categories, workspaceId) {
  return Promise.all(categories.map(async (category) => {
    const usageCount = await Lead.countDocuments({ workspaceId, leadCategory: category.name });
    const json = category.toJSON();
    json.usageCount = usageCount;
    return json;
  }));
}

async function listLeadCategories(request, response) {
  try {
    await ensureDefaultCategories(request.auth.workspaceId);
    const filter = { workspaceId: request.auth.workspaceId };
    if (request.query.search) filter.name = { $regex: request.query.search, $options: 'i' };

    const categories = await LeadCategory.find(filter).sort({ name: 1 });
    return success(response, await attachUsageCount(categories, request.auth.workspaceId));
  } catch (err) {
    return serverError(response, err);
  }
}

async function createLeadCategory(request, response) {
  try {
    if (!request.body.name) return validationError(response, 'name é obrigatório.');

    const category = await LeadCategory.create({
      workspaceId: request.auth.workspaceId,
      name: request.body.name,
      description: request.body.description || '',
      message: request.body.message || ''
    });

    const json = category.toJSON();
    json.usageCount = 0;
    return success(response, json, 201);
  } catch (err) {
    if (err.code === 11000) return error(response, 409, 'CATEGORY_NAME_EXISTS', 'Já existe categoria com esse nome.');
    return serverError(response, err);
  }
}

async function getLeadCategory(request, response) {
  try {
    const category = await LeadCategory.findOne({ _id: request.params.categoryId, workspaceId: request.auth.workspaceId });
    if (!category) return notFound(response, 'Categoria não encontrada.');
    const [json] = await attachUsageCount([category], request.auth.workspaceId);
    return success(response, json);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateLeadCategory(request, response) {
  try {
    const current = await LeadCategory.findOne({ _id: request.params.categoryId, workspaceId: request.auth.workspaceId });
    if (!current) return notFound(response, 'Categoria não encontrada.');

    const oldName = current.name;
    ['name', 'description', 'message'].forEach((field) => {
      if (request.body[field] !== undefined) current[field] = request.body[field];
    });
    await current.save();

    let updatedLeads = 0;
    if (request.body.name && request.body.name !== oldName) {
      const result = await Lead.updateMany(
        { workspaceId: request.auth.workspaceId, leadCategory: oldName },
        { leadCategory: request.body.name }
      );
      updatedLeads = result.modifiedCount || 0;
    }

    return success(response, {
      id: current.id,
      name: current.name,
      description: current.description,
      message: current.message,
      updatedLeads,
      updatedAt: current.updatedAt
    });
  } catch (err) {
    if (err.code === 11000) return error(response, 409, 'CATEGORY_NAME_EXISTS', 'Já existe categoria com esse nome.');
    return serverError(response, err);
  }
}

async function deleteLeadCategory(request, response) {
  try {
    const category = await LeadCategory.findOneAndDelete({ _id: request.params.categoryId, workspaceId: request.auth.workspaceId });
    if (!category) return notFound(response, 'Categoria não encontrada.');

    const result = await Lead.updateMany(
      { workspaceId: request.auth.workspaceId, leadCategory: category.name },
      { leadCategory: '' }
    );

    return success(response, { success: true, updatedLeads: result.modifiedCount || 0 });
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = {
  ensureDefaultCategories,
  listLeadCategories,
  createLeadCategory,
  getLeadCategory,
  updateLeadCategory,
  deleteLeadCategory
};
