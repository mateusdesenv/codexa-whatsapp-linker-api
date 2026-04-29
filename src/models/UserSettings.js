const mongoose = require('mongoose');
const { DEFAULT_SETTINGS } = require('../utils/defaults');

const userSettingsSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    theme: { type: String, enum: ['dark', 'light'], default: DEFAULT_SETTINGS.theme },
    menuOrder: { type: [String], default: DEFAULT_SETTINGS.menuOrder },
    menuVisibility: {
      type: mongoose.Schema.Types.Mixed,
      default: DEFAULT_SETTINGS.menuVisibility
    },
    settingsSectionOrder: { type: [String], default: DEFAULT_SETTINGS.settingsSectionOrder }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.workspaceId;
        delete ret.userId;
        delete ret.createdAt;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('UserSettings', userSettingsSchema);
