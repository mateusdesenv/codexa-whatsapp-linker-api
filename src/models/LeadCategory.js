const mongoose = require('mongoose');

const leadCategorySchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'O nome da categoria é obrigatório.'], trim: true },
    description: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' }
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

leadCategorySchema.index({ workspaceId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LeadCategory', leadCategorySchema);
