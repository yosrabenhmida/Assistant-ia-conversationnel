const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");
const Conversation = require("./models/Conversation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion MongoDB:", err));

const client = new Groq({ apiKey: GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const SYSTEM_PROMPT =
  "Tu es un assistant intelligent et utile, capable de comprendre et de répondre dans toutes les langues (français, anglais, arabe, italien, espagnol, allemand, et toute autre langue). RÈGLE ABSOLUE : détecte la langue du DERNIER message de l'utilisateur et réponds UNIQUEMENT dans cette langue, même si les messages précédents de la conversation étaient dans une langue différente. Ignore complètement la langue des messages précédents pour décider de ta langue de réponse. Si le dernier message est en italien, réponds en italien. Si c'est en arabe, réponds en arabe. Et ainsi de suite pour toute langue détectée.";

// ── Multer ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Type de fichier non supporté."));
  },
});

// ── MIDDLEWARE TOKEN (défini avant toutes les routes) ────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Token invalide" });
  }
};

// ── AUTH ROUTES ──────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "Compte créé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

app.patch("/api/auth/update-username", verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username: req.body.username },
      { new: true },
    );
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.patch("/api/auth/update-email", verifyToken, async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing)
      return res.status(400).json({ message: "Email déjà utilisé" });
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { email: req.body.email },
      { new: true },
    );
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.patch("/api/auth/update-password", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete("/api/auth/delete", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ── CHAT ─────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ error: "Le champ message est requis." });
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });
    res.json({ reply: response.choices[0]?.message?.content || "" });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Erreur interne du serveur." });
  }
});

// ── CONVERSATIONS ─────────────────────────────────────────────
app.get("/api/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .select("title createdAt documentName")
      .sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des conversations." });
  }
});

app.get("/api/conversations/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res.status(404).json({ error: "Conversation introuvable." });
    res.json(conversation);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la conversation." });
  }
});

app.post("/api/conversations", async (req, res) => {
  try {
    const conversation = new Conversation({
      title: req.body.title || "Nouvelle conversation",
      messages: [],
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la conversation." });
  }
});

app.get("/", (req, res) => {
  res.send("API Assistant IA Conversationnel - OK ✅");
});

app.put("/api/conversations/:id", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ error: "Le champ message est requis." });
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res.status(404).json({ error: "Conversation introuvable." });
    conversation.messages.push({ role: "user", content: message });
    if (conversation.messages.length === 1)
      conversation.title = message.slice(0, 40);
    let systemContent = SYSTEM_PROMPT;
    if (conversation.documentContext) {
      systemContent += `\n\n=== DOCUMENT DE RÉFÉRENCE ===\nL'utilisateur a fourni le fichier "${conversation.documentName}". Voici son contenu :\n\n${conversation.documentContext}\n\n=== INSTRUCTIONS ===\nUtilise activement ce contenu pour répondre à TOUTES les questions.`;
    }
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemContent },
        ...conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });
    const reply = response.choices[0]?.message?.content || "";
    conversation.messages.push({ role: "assistant", content: reply });
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Erreur interne du serveur." });
  }
});

app.delete("/api/conversations/:id", async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ message: "Conversation supprimée." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

app.patch("/api/conversations/:id/rename", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim())
    return res.status(400).json({ error: "Le titre est requis." });
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title: title.trim().slice(0, 80) },
      { new: true },
    );
    if (!conversation)
      return res.status(404).json({ error: "Conversation introuvable." });
    res.json({ _id: conversation._id, title: conversation.title });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du renommage." });
  }
});

// ── UPLOAD ───────────────────────────────────────────────────
app.post(
  "/api/conversations/:id/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation)
        return res.status(404).json({ error: "Conversation introuvable." });
      if (!req.file)
        return res.status(400).json({ error: "Aucun fichier reçu." });

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const originalName = req.file.originalname;

      if (mimeType === "application/pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const pdfResult = await parser.getText();
        await parser.destroy();
        const extractedText = pdfResult.text.slice(0, 15000);
        const numPages = pdfResult.pages?.length || 1;
        conversation.documentContext = extractedText;
        conversation.documentName = originalName;
        conversation.messages.push({
          role: "user",
          content: `[Fichier envoyé : "${originalName}" (PDF, ${numPages} page(s))]`,
        });
        const systemContent = `${SYSTEM_PROMPT}\n\n=== DOCUMENT ===\n${extractedText}\n\nPrésente brièvement ce que tu as compris du document.`;
        const response = await client.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemContent },
            ...conversation.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
        const reply = response.choices[0]?.message?.content || "";
        conversation.messages.push({ role: "assistant", content: reply });
        if (conversation.messages.length <= 2)
          conversation.title = `Document : ${originalName}`.slice(0, 40);
        await conversation.save();
        return res.json({
          message: "PDF analysé.",
          documentName: originalName,
          pages: numPages,
          conversation,
        });
      }

      if (mimeType.startsWith("image/")) {
        const base64Image = fs.readFileSync(filePath).toString("base64");
        const visionResponse = await client.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyse cette image de façon exhaustive.",
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64Image}` },
                },
              ],
            },
          ],
        });
        const imageDescription =
          visionResponse.choices[0]?.message?.content || "";
        conversation.documentContext = imageDescription;
        conversation.documentName = originalName;
        conversation.messages.push({
          role: "user",
          content: `[Image envoyée : "${originalName}"]`,
        });
        const systemContent = `${SYSTEM_PROMPT}\n\n=== IMAGE ===\n${imageDescription}\n\nPrésente brièvement ce que tu vois dans l'image.`;
        const textResponse = await client.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemContent },
            ...conversation.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
        const reply = textResponse.choices[0]?.message?.content || "";
        conversation.messages.push({ role: "assistant", content: reply });
        if (conversation.messages.length <= 2)
          conversation.title = `Image : ${originalName}`.slice(0, 40);
        await conversation.save();
        return res.json({
          message: "Image analysée.",
          documentName: originalName,
          conversation,
        });
      }

      return res.status(400).json({ error: "Type de fichier non supporté." });
    } catch (error) {
      console.error("Erreur upload:", error);
      res.status(500).json({
        error: error.message || "Erreur lors du traitement du fichier.",
      });
    }
  },
);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
