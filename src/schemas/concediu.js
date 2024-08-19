const { Schema, model } = require("mongoose");

const concediuSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  concediu: {
    start: Date,
    end: Date
  }
});

module.exports = model("Concedii", concediuSchema, "concedii");
