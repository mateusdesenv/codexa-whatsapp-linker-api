function parsePagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const perPage = Math.min(Math.max(parseInt(query.perPage || '20', 10), 1), 100);
  const skip = (page - 1) * perPage;
  return { page, perPage, skip };
}

function parseSort(sort = 'updatedAt:desc') {
  const parts = String(sort || '').split(',').filter(Boolean);
  if (!parts.length) return { updatedAt: -1 };

  return parts.reduce((acc, part) => {
    const [field, direction] = part.split(':');
    if (field) acc[field] = direction === 'asc' ? 1 : -1;
    return acc;
  }, {});
}

function boolFromQuery(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value) === 'true';
}

module.exports = { parsePagination, parseSort, boolFromQuery };
