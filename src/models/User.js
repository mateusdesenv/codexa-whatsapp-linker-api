const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O campo nome é obrigatório.'],
      trim: true,
      minlength: [2, 'O nome deve ter pelo menos 2 caracteres.']
    },
    usuario: {
      type: String,
      required: [true, 'O campo usuário é obrigatório.'],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [3, 'O usuário deve ter pelo menos 3 caracteres.']
    },
    senha: {
      type: String,
      required: [true, 'O campo senha é obrigatório.'],
      minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.senha;
        return ret;
      }
    }
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('senha')) return next();

  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

userSchema.pre('findOneAndUpdate', async function hashPasswordOnUpdate(next) {
  const update = this.getUpdate();

  if (update && update.senha) {
    const salt = await bcrypt.genSalt(10);
    update.senha = await bcrypt.hash(update.senha, salt);
    this.setUpdate(update);
  }

  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.senha);
};

module.exports = mongoose.model('User', userSchema);
