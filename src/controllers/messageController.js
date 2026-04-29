const Message = require('../models/Message');
const { success, notFound, validationError, serverError } = require('../utils/response');
const { parsePagination, parseSort } = require('../utils/query');

function buildMessageFilter(request) {
  const { search, favorite } = request.query;
  const filter = { workspaceId: request.auth.workspaceId };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { body: { $regex: search, $options: 'i' } }
    ];
  }

  if (favorite !== undefined && favorite !== '') {
    filter.favorite = String(favorite) === 'true';
  }

  return filter;
}

async function listMessages(request, response) {
  try {
    const filter = buildMessageFilter(request);
    const { page, perPage, skip } = parsePagination(request.query);
    const sort = request.query.sort ? parseSort(request.query.sort) : { favorite: -1, updatedAt: -1 };

    const [items, total] = await Promise.all([
      Message.find(filter).sort(sort).skip(skip).limit(perPage),
      Message.countDocuments(filter)
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

async function createMessage(request, response) {
  try {
    const { title, body, favorite = false } = request.body;
    if (!title || !body) {
      return validationError(response, 'title e body são obrigatórios.');
    }

    const item = await Message.create({
      workspaceId: request.auth.workspaceId,
      title,
      body,
      favorite: Boolean(favorite)
    });

    return success(response, item, 201);
  } catch (err) {
    return serverError(response, err);
  }
}

async function getMessage(request, response) {
  try {
    const item = await Message.findOne({ _id: request.params.messageId, workspaceId: request.auth.workspaceId });
    if (!item) return notFound(response, 'Mensagem não encontrada.');
    return success(response, item);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateMessage(request, response) {
  try {
    const payload = {};
    ['title', 'body'].forEach((field) => {
      if (request.body[field] !== undefined) payload[field] = request.body[field];
    });
    if (request.body.favorite !== undefined) payload.favorite = Boolean(request.body.favorite);

    const item = await Message.findOneAndUpdate(
      { _id: request.params.messageId, workspaceId: request.auth.workspaceId },
      payload,
      { new: true, runValidators: true }
    );

    if (!item) return notFound(response, 'Mensagem não encontrada.');
    return success(response, item);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateFavorite(request, response) {
  try {
    const item = await Message.findOneAndUpdate(
      { _id: request.params.messageId, workspaceId: request.auth.workspaceId },
      { favorite: Boolean(request.body.favorite) },
      { new: true }
    );

    if (!item) return notFound(response, 'Mensagem não encontrada.');
    return success(response, {
      id: item.id,
      favorite: item.favorite,
      updatedAt: item.updatedAt
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function deleteMessage(request, response) {
  try {
    const item = await Message.findOneAndDelete({ _id: request.params.messageId, workspaceId: request.auth.workspaceId });
    if (!item) return notFound(response, 'Mensagem não encontrada.');
    return success(response, { success: true });
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = {
  listMessages,
  createMessage,
  getMessage,
  updateMessage,
  updateFavorite,
  deleteMessage
};
