const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Nouvelle conversation",
  },
  messages: [messageSchema],
  // Texte extrait d'un PDF uploadé dans cette conversation (contexte RAG)
  documentContext: {
    type: String,
    default: "",
  },
  documentName: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Conversation", conversationSchema);
