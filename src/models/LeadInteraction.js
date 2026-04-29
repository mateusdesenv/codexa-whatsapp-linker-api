const mongoose = require('mongoose');

const leadInteractionSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: { type: String, trim: true, required: true },
    sent: { type: Boolean, default: false },
    statusAfterSend: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.leadId = ret.leadId.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.workspaceId;
        delete ret.updatedAt;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('LeadInteraction', leadInteractionSchema);
