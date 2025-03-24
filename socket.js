// socket.js
import { Server } from "socket.io";
import { Conversation, Message } from "./models/ChatModel.js";

const configureSocket = (io) => {

  
  // Store online users
  const onlineUsers = new Map();
  
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // User comes online
    socket.on("setup", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} is online`);
      socket.emit("connected");
    });
    
    // User joins a chat
    socket.on("join chat", (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined chat: ${conversationId}`);
    });

    // User joins a chat
    socket.on("active users request", () => {
     console.log('active users requested', onlineUsers)
     socket.emit('active users', {'user1': "Jody"})
    });
    
    // Typing indicators
    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("typing", conversationId);
    });
    
    socket.on("stop typing", (conversationId) => {
      socket.to(conversationId).emit("stop typing", conversationId);
    });
    
    socket.on("new message", async (messageData) => {
      const { conversation, content, sender } = messageData;
      console.log("New message received:", content);
    
      try {
        // Step 1: Create a new Message document
        const newMessage = new Message({
          sender: sender,
          content: content,
          createdAt: new Date(),
        });
    
        const savedMessage = await newMessage.save();
        console.log('saving Message', savedMessage)
       
    
        // Step 2: Update the Conversation with the new Message
        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversation._id,
          {
            $push: {
              messages: savedMessage, 
            },
            latestMessage: savedMessage._id, // Update latestMessage with the ObjectId
          },
          { new: true }
        ).populate("messages", "read attachments messageType content sender" )
          .populate("participants", "firstName lastName picturePath")
          .populate("latestMessage");
    console.log('conversation', updatedConversation)
        // Step 3: Prepare the data to send to the other participant
        const messageToSend = {
          conversationId: conversation._id, // Include the conversation ID
          newMessage: {
            _id: savedMessage._id,
            sender: savedMessage.sender,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
          },
        };
    
    
        // Step 4: Emit the new message to all participants except the sender
        updatedConversation.participants.forEach((participant) => {
          if (participant._id.toString() !== sender.toString()) {
            const socketId = onlineUsers.get(participant._id.toString());
            
            if (socketId) {
            
             // console.log("Emitting message received ", {messageToSend});
              socket.to(socketId).emit("message received", {messageToSend});
            }
          }
        });
    
        // Step 5: Emit to the conversation room (optional, if needed)
        io.to(conversation._id.toString()).emit("update conversation", updatedConversation);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
    
    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Remove user from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
  
  return io;
};

export default configureSocket;