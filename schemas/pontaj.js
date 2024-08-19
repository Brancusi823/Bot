const { Schema, model } = require("mongoose");

const pontajSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  messageId: String,
  estePontajDeschis: { type: Boolean, default: true },
  pontajDeschisLa: Date,
  pontajInchisLa: { type: Date, default: null },
  totalMinute: { type: Number, default: 0 },
  estePontajAnulat: { type: Boolean, default: false }
});

module.exports = model("Pontaj", pontajSchema, "pontaje");
