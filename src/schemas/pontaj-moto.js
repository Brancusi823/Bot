const { Schema, model } = require("mongoose");

const pontajMotoSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  messageId: String,
  pontajDeschisLa: Date,
  tipMoto: String,
});

module.exports = model("PontajMoto", pontajMotoSchema, "pontajeMoto");
