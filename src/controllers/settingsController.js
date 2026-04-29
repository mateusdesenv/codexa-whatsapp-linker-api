const UserSettings = require('../models/UserSettings');
const { DEFAULT_SETTINGS } = require('../utils/defaults');
const { success, error, serverError } = require('../utils/response');

const VALID_MENU_KEYS = ['generator', 'messages', 'leads', 'categories', 'statuses', 'settings'];
const VALID_MAIN_MENU_KEYS = ['generator', 'leads', 'settings'];
const VALID_SETTING_SECTION_KEYS = ['theme', 'menu', 'status', 'backup'];

function sanitizeMenuVisibility(menuVisibility = {}) {
  const output = { ...DEFAULT_SETTINGS.menuVisibility };
  VALID_MENU_KEYS.forEach((key) => {
    if (menuVisibility[key] !== undefined) output[key] = Boolean(menuVisibility[key]);
  });
  output.settings = true;
  return output;
}

function sanitizeOrder(order = [], allowed = []) {
  const unique = Array.from(new Set(Array.isArray(order) ? order : []));
  const valid = unique.filter((key) => allowed.includes(key));
  const missing = allowed.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
}

async function getOrCreateSettings(workspaceId, userId) {
  let settings = await UserSettings.findOne({ workspaceId });
  if (!settings) {
    settings = await UserSettings.create({
      workspaceId,
      userId,
      ...DEFAULT_SETTINGS
    });
  }
  return settings;
}

async function getSettings(request, response) {
  try {
    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    return success(response, settings);
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateTheme(request, response) {
  try {
    const { theme } = request.body;
    if (!['dark', 'light'].includes(theme)) {
      return error(response, 400, 'INVALID_THEME', 'Valores aceitos: dark, light.');
    }

    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    settings.theme = theme;
    await settings.save();
    return success(response, { theme: settings.theme, updatedAt: settings.updatedAt });
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateMenuOrder(request, response) {
  try {
    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    settings.menuOrder = sanitizeOrder(request.body.menuOrder, VALID_MAIN_MENU_KEYS);
    await settings.save();
    return success(response, { menuOrder: settings.menuOrder, updatedAt: settings.updatedAt });
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateMenuVisibility(request, response) {
  try {
    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    settings.menuVisibility = sanitizeMenuVisibility(request.body.menuVisibility);
    settings.markModified('menuVisibility');
    await settings.save();
    return success(response, {
      menuVisibility: settings.menuVisibility,
      locked: ['settings'],
      updatedAt: settings.updatedAt
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function updateSectionsOrder(request, response) {
  try {
    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    settings.settingsSectionOrder = sanitizeOrder(request.body.settingsSectionOrder, VALID_SETTING_SECTION_KEYS);
    await settings.save();
    return success(response, { settingsSectionOrder: settings.settingsSectionOrder, updatedAt: settings.updatedAt });
  } catch (err) {
    return serverError(response, err);
  }
}

async function resetSettings(request, response) {
  try {
    const settings = await getOrCreateSettings(request.auth.workspaceId, request.auth.userId);
    const keys = Array.isArray(request.body.keys) ? request.body.keys : [];
    const keysToReset = keys.length ? keys : ['theme', 'menuOrder', 'menuVisibility', 'settingsSectionOrder'];

    if (keysToReset.includes('theme')) settings.theme = DEFAULT_SETTINGS.theme;
    if (keysToReset.includes('menuOrder')) settings.menuOrder = DEFAULT_SETTINGS.menuOrder;
    if (keysToReset.includes('menuVisibility')) {
      settings.menuVisibility = DEFAULT_SETTINGS.menuVisibility;
      settings.markModified('menuVisibility');
    }
    if (keysToReset.includes('settingsSectionOrder')) settings.settingsSectionOrder = DEFAULT_SETTINGS.settingsSectionOrder;

    await settings.save();
    return success(response, {
      theme: settings.theme,
      menuOrder: settings.menuOrder,
      menuVisibility: settings.menuVisibility,
      settingsSectionOrder: settings.settingsSectionOrder
    });
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = {
  getOrCreateSettings,
  getSettings,
  updateTheme,
  updateMenuOrder,
  updateMenuVisibility,
  updateSectionsOrder,
  resetSettings
};
