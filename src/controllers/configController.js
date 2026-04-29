const Message = require('../models/Message');
const Lead = require('../models/Lead');
const LeadCategory = require('../models/LeadCategory');
const LeadStatus = require('../models/LeadStatus');
const UserSettings = require('../models/UserSettings');
const { getOrCreateSettings } = require('./settingsController');
const { normalizeLeadPayload } = require('./leadController');
const { success, error, serverError } = require('../utils/response');

function safeParseJSON(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
}

function extractLegacyItems(payload = {}) {
  const items = payload.items || {};
  return {
    messages: safeParseJSON(items.codexa_whatsapp_messages, []),
    leads: safeParseJSON(items.codexa_whatsapp_leads, []),
    leadCategories: safeParseJSON(items.codexa_lead_categories, []),
    leadStatuses: safeParseJSON(items.codexa_lead_statuses, []),
    settings: {
      theme: safeParseJSON(items.codexa_app_theme, items.codexa_app_theme),
      menuOrder: safeParseJSON(items.codexa_app_menu_order, undefined),
      menuVisibility: safeParseJSON(items.codexa_app_menu_visibility, undefined),
      settingsSectionOrder: safeParseJSON(items.codexa_settings_section_order, undefined)
    }
  };
}

async function exportConfig(request, response) {
  try {
    const workspaceId = request.auth.workspaceId;
    const [messages, leads, leadCategories, leadStatuses, settings] = await Promise.all([
      Message.find({ workspaceId }).sort({ updatedAt: -1 }),
      Lead.find({ workspaceId }).sort({ updatedAt: -1 }),
      LeadCategory.find({ workspaceId }).sort({ name: 1 }),
      LeadStatus.find({ workspaceId }).sort({ position: 1 }),
      getOrCreateSettings(workspaceId, request.auth.userId)
    ]);

    return response.status(200).json({
      type: 'codexa-prospect-config',
      version: 2,
      exportedAt: new Date().toISOString(),
      items: {
        codexa_whatsapp_messages: JSON.stringify(messages),
        codexa_whatsapp_leads: JSON.stringify(leads),
        codexa_lead_categories: JSON.stringify(leadCategories),
        codexa_lead_statuses: JSON.stringify(leadStatuses),
        codexa_app_theme: settings.theme,
        codexa_app_menu_order: JSON.stringify(settings.menuOrder),
        codexa_app_menu_visibility: JSON.stringify(settings.menuVisibility),
        codexa_settings_section_order: JSON.stringify(settings.settingsSectionOrder)
      },
      data: {
        messages,
        leads,
        leadCategories,
        leadStatuses,
        settings
      }
    });
  } catch (err) {
    return serverError(response, err);
  }
}

async function importConfig(request, response) {
  try {
    const { mode = 'merge', payload } = request.body;
    if (!payload || typeof payload !== 'object') {
      return error(response, 400, 'INVALID_CONFIG_FILE', 'Arquivo não parece ser configuração do Codexa Prospect.');
    }

    const workspaceId = request.auth.workspaceId;
    const userId = request.auth.userId;
    const normalized = payload.data || extractLegacyItems(payload);

    if (mode === 'replace') {
      await Promise.all([
        Message.deleteMany({ workspaceId }),
        Lead.deleteMany({ workspaceId }),
        LeadCategory.deleteMany({ workspaceId }),
        LeadStatus.deleteMany({ workspaceId })
      ]);
    }

    const imported = {
      messages: 0,
      leads: 0,
      leadCategories: 0,
      leadStatuses: 0,
      settings: 0
    };

    if (Array.isArray(normalized.messages)) {
      for (const item of normalized.messages) {
        if (!item.title || !item.body) continue;
        await Message.create({ workspaceId, title: item.title, body: item.body, favorite: Boolean(item.favorite) });
        imported.messages += 1;
      }
    }

    if (Array.isArray(normalized.leads)) {
      for (const item of normalized.leads) {
        const payloadLead = normalizeLeadPayload(item);
        if (!payloadLead.name && !payloadLead.phone && !payloadLead.website) continue;
        await Lead.create({ ...payloadLead, workspaceId });
        imported.leads += 1;
      }
    }

    if (Array.isArray(normalized.leadCategories)) {
      for (const item of normalized.leadCategories) {
        if (!item.name) continue;
        await LeadCategory.updateOne(
          { workspaceId, name: item.name },
          { workspaceId, name: item.name, description: item.description || '', message: item.message || '' },
          { upsert: true }
        );
        imported.leadCategories += 1;
      }
    }

    if (Array.isArray(normalized.leadStatuses)) {
      for (const item of normalized.leadStatuses) {
        if (!item.name) continue;
        await LeadStatus.updateOne(
          { workspaceId, name: item.name },
          { workspaceId, name: item.name, description: item.description || '', position: item.position || imported.leadStatuses + 1 },
          { upsert: true }
        );
        imported.leadStatuses += 1;
      }
    }

    if (normalized.settings && typeof normalized.settings === 'object') {
      const settings = await getOrCreateSettings(workspaceId, userId);
      if (normalized.settings.theme) settings.theme = normalized.settings.theme;
      if (Array.isArray(normalized.settings.menuOrder)) settings.menuOrder = normalized.settings.menuOrder;
      if (normalized.settings.menuVisibility) {
        settings.menuVisibility = normalized.settings.menuVisibility;
        settings.markModified('menuVisibility');
      }
      if (Array.isArray(normalized.settings.settingsSectionOrder)) settings.settingsSectionOrder = normalized.settings.settingsSectionOrder;
      await settings.save();
      imported.settings = 1;
    }

    return success(response, {
      imported,
      ignoredKeys: ['codexa_pre_programmed_messages'],
      mode
    });
  } catch (err) {
    return serverError(response, err);
  }
}

module.exports = { exportConfig, importConfig };
