import SocialComment from "../models/Comment.js"; import Post from "../models/Post.js";
import User from "../models/User.js";
export const createComment = async (req, res) => {
    try {
      const { userId, postId, firstName, lastName, description } = req.body;
      
      // Create new comment
      const newComment = new SocialComment({
        userId,
        postId,
        firstName,
        lastName,
        description,
        likes: {},
        replies: []
      });
      
      const savedComment = await newComment.save();
      
      // Add comment reference to the post
      await Post.findByIdAndUpdate(
        postId,
        { $push: { newComments: savedComment._id } }
      );
      
      // Return the post with populated comments
      const updatedPost = await Post.findById(postId).populate('newComments');
      
      res.status(201).json(updatedPost);
    } catch (err) {




      res.status(409).json({ message: err.message });
    }
  };

  export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await SocialComment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    const postId = comment.postId;
    
    // Delete the comment
    await SocialComment.findByIdAndDelete(id);
    
    // Remove the reference from the post
    await Post.findByIdAndUpdate(
      postId,
      { $pull: { newComments: id } }
    );
    
    // Return the updated post
    const updatedPost = await Post.findById(postId).populate('newComments');
    
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};