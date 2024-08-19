const { Schema, model } = require("mongoose");

const procesareSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userInfo: {
    userId: String,
    messageId: String,
  },
  suspectInfo: {
    numePrenume: String,
    cnp: String,
    acuzatii: [],
    domiciliu: String,
    poza: String,
    raport: String,
  }
});

module.exports = model("Procesari", procesareSchema, "procesari");
