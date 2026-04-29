const mongoose = require('mongoose');

const leadStatusSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'O nome do status é obrigatório.'], trim: true },
    description: { type: String, trim: true, default: '' },
    position: { type: Number, default: 0 }
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
        return ret;
      }
    }
  }
);

leadStatusSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
leadStatusSchema.index({ workspaceId: 1, position: 1 });

module.exports = mongoose.model('LeadStatus', leadStatusSchema);
