import mongoose from "mongoose";

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialUser",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    attachments: [{ type: String }], // For future file/image sharing
    messageType: {
      type: String,
      default: "text",
      enum: ["text", "image", "file"] // Supports future expansion
    }
  },
  { timestamps: true }
);

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialUser"
    }],
    messages: [messageSchema],
    isGroup: {
      type: Boolean,
      default: false
    },
    name: {
      type: String, // Only needed for group chats
      default: ""
    },
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialUser"
    } // For group chats
  },
  { timestamps: true }
);

// Create models
const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

export { Message, Conversation };