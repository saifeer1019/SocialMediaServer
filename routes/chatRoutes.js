// routes/chatRoutes.js
import express from "express";
import { 
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  createGroupConversation
} from "../controllers/chatController.js";
import { verifyToken } from "../middleware/auth.js"; // Assuming you have auth middleware

const router = express.Router();

// Apply auth middleware to all chat routes
router.use(verifyToken);

// Routes
router.get("/:userId/conversations", getUserConversations);
router.post("/conversation", getOrCreateConversation);
router.get("/conversation/:conversationId/messages", getConversationMessages);
router.post("/group", createGroupConversation);

export default router;