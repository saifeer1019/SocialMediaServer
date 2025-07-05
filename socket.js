// socket.js
import { Server } from "socket.io";
import { Conversation, Message } from "./models/ChatModel.js";import jwt from "jsonwebtoken";

const configureSocket = (io) => {
  // Store online users
  const onlineUsers = new Map();
  let users = {};

  // Middleware for authenticating socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }
      
      // Remove "Bearer " prefix if present
      const finalToken = token.startsWith("Bearer ") 
        ? token.slice(7).trimLeft() 
        : token;
      
      // Verify the token
      const verified = jwt.verify(finalToken, process.env.JWT_SECRET);
      socket.user = verified; // Attach user data to socket
      next();
    } catch (err) {
      return next(new Error("Authentication error: " + err.message));
    }
  });

  
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // User comes online
    socket.on("setup", (userId) => {
      onlineUsers.set(userId, socket.id);
      users[userId] = {
        socketId: socket.id}

      socket.join(userId);
      console.log(`User ${userId} is online`, users);

      socket.emit("connected");
    });
  


    socket.on("register", ({userId, peerId}) => {
      console.log('User registered:', userId, 'with peerId:', peerId);

      users[userId] = { ...users[userId], peerId: peerId };
      socket.userId = userId;
  
      // Notify other users about new user
      socket.broadcast.emit('user-connected', {
        userId,
        peerId,
      });

      console.log('registering', userId, peerId )
    });

    //video calling registration

    
    socket.on("register-reciever-to", ({reciever, caller}) => {

 io.to(users[caller]?.socketId).emit('reciever-peer', reciever)
    });

     
    socket.on("reject-call-from", ({ caller}) => {

 io.to(users[caller]?.socketId).emit('call-rejected')
    });
    


    socket.on('calling', ({ to, from }) => {
      console.log('Call initiated from', from, 'to', to);
      console.log(users);
  
      // Ensure the to user exists and has a socketId
      const socketId = users[to._id]?.socketId;
      if (!socketId) {
          console.error(`No socketId found for user with _id ${to._id}`);
          return; // Handle this case (e.g., user might be offline)
      }
  
      // Emit the incoming call to the receiver (user being called)
      io.to(socketId).emit('incoming-call', { from });

  
      // Listen for the receiver registering their peerId
      socket.on("register-receiver", ({ userId2, peerId2 }) => {
          // Update the users object with the new peerId for the receiver
          if (!users[userId2]) {
              console.error(`User with _id ${userId2} not found`);
              return; // Handle this case
          }
          console.log('register_reciver hit')
  
          // Update user2's peerId
          users[userId2] = { ...users[userId2], peerId: peerId2 };
  
          // Now, emit the receiver's peerId back to the caller
          const socketId2 = users[from._id]?.socketId;
          if (!socketId2) {
              console.error(`No socketId found for user with _id ${from._id}`);
              return; // Handle this case as well
          }
  
          // Emit the receiver-registered event back to the caller
          io.to(socketId2).emit('receiver-registered', { peerId: users[from._id]?.peerId });
      });
  });
  




    // User joins a chat
    socket.on("join chat", (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined chat: ${conversationId}`);
    });


            socket.on('call-closed', ( {to}) => {
              try {
                console.log(`recieving call closed`, users[to].socketId)
                const socketId = users[to].socketId
                io.to(socketId).emit('call-closed', { peerId: 'jhvg' });
              } catch (error) {
                console.log(error)
              }
             
          // const socketId_ = users[to.from?._id].socketId
          // console.log('call closed', to, socketId_ ),
  
            })


    // Active users request
    socket.on("active users request", () => {
      console.log('active users requested', Array.from(onlineUsers.keys()));
      const activeUsers = {};
      onlineUsers.forEach((value, key) => {
        activeUsers[key] = true;
      });
      socket.emit('active users', activeUsers);
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
        console.log('Message saved:', savedMessage);
       
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
        )
        .populate("messages", "-__v")
        .populate("participants", "firstName lastName picturePath")
        .populate("latestMessage");
        
      
    
        // Step 3: Prepare the data to send to the other participant
        const messageToSend = {
          conversationId: conversation._id, 
          newMessage: {
            _id: savedMessage._id,
            sender: savedMessage.sender,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
          },
        };
    
        // Step 4: Emit the new message to all participants except the sender
        updatedConversation.participants.forEach((participant) => {
          const participantId = participant._id.toString();
          if (participantId !== sender.toString()) {
            const socketId = onlineUsers.get(participantId);
            
            if (socketId) {
              console.log(`Emitting message to user ${participantId}`);
              socket.to(socketId).emit("message received", { messageToSend });
            }
          }
        });
    
        // Step 5: Emit to the conversation room (all participants)
        io.to(conversation._id.toString()).emit("update conversation", updatedConversation);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message error", { error: error.message });
      }
    });
    
    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Remove user from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} is now offline`);
          break;
        }
      }
    });
  });
  
  return io;
};

export default configureSocket;