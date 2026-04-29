const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    countryCode: { type: String, trim: true, default: 'BR' },
    category: { type: String, trim: true, default: '' },
    leadCategory: { type: String, trim: true, default: '' },
    categories: [{ type: String, trim: true }],
    mapsUrl: { type: String, trim: true, default: '' },
    totalScore: { type: Number, default: null },
    reviewsCount: { type: Number, default: null },
    status: { type: String, trim: true, default: 'Novo' },
    notes: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: 'Importação manual' }
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

leadSchema.pre('validate', function validateMinimum(next) {
  if (!this.name && !this.phone && !this.website) {
    this.invalidate('name', 'Preencha pelo menos nome, telefone ou site do lead.');
  }
  next();
});

leadSchema.index({ workspaceId: 1, updatedAt: -1 });
leadSchema.index({ workspaceId: 1, status: 1 });
leadSchema.index({ workspaceId: 1, leadCategory: 1 });
leadSchema.index({ workspaceId: 1, mapsUrl: 1 });

module.exports = mongoose.model('Lead', leadSchema);
