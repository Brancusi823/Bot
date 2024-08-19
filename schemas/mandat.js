const { Schema, model } = require("mongoose");

const mandatSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userInfo: {
    userId: String,
    messageId: String,
  },
  suspectInfo: {
    numePrenume: String,
    cnp: String,
    acuzatii: [],
    gradCautare: Number,
    poza: String,
  }
});

module.exports = model("Mandate", mandatSchema, "mandate");
