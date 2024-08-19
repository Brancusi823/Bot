const { Schema, model } = require("mongoose");

const insigneSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  fivemId: String,
  nrInsigna: { type: Number, default: null },
  nrInsignaDiicot: { type: String, default: "" },
  rank: String,
  procesari: { type: Number, default: 0 },
  totalZileConcediu: { type: Number, default: 0 }
});

module.exports = model("Insigne", insigneSchema, "insigne");
