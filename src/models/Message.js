const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'O título é obrigatório.'], trim: true },
    body: { type: String, required: [true, 'O corpo da mensagem é obrigatório.'], trim: true },
    favorite: { type: Boolean, default: false }
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

messageSchema.index({ workspaceId: 1, favorite: -1, updatedAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
