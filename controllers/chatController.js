// controllers/chatController.js
import { Conversation, Message } from "../models/ChatModel.js";
import SocialUser from "../models/User.js";

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await Conversation.find({
      participants: { $elemMatch: { $eq: userId } }
    })
    .populate("participants", "firstName lastName picturePath")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });
    
    res.status(200).json(conversations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const { firstUserId, secondUserId } = req.body;
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      isGroup: false,
      $and: [
        { participants: { $elemMatch: { $eq: firstUserId } } },
        { participants: { $elemMatch: { $eq: secondUserId } } }
      ]
    })
    .populate("participants", "firstName lastName picturePath")
    .populate("latestMessage");
    
    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }
    
    // Create new conversation
    const newConversation = await Conversation.create({
      participants: [firstUserId, secondUserId],
      isGroup: false
    });
    
    // Populate participant data
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate("participants", "firstName lastName picturePath");
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Get all messages for a conversation
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    res.status(200).json(conversation.messages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Create a new group conversation
export const createGroupConversation = async (req, res) => {
  try {
    const { name, participants, admin } = req.body;
    
    // Ensure we have at least 3 participants including the admin
    if (participants.length < 3) {
      return res.status(400).json({ 
        message: "Group chat requires at least 3 participants" 
      });
    }
    
    const newGroupConversation = await Conversation.create({
      name,
      participants,
      admin,
      isGroup: true
    });
    
    const populatedConversation = await Conversation.findById(newGroupConversation._id)
      .populate("participants", "firstName lastName picturePath")
      .populate("admin", "firstName lastName");
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};