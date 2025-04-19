import Post from "../models/Post.js";
import User from "../models/User.js";
import SocialComment from "../models/Comment.js";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    
    // Extract picturePaths from request
    const picturePaths = [];
    if (req.files && req.files.pictures) {
      // If single file
      if (!Array.isArray(req.files.pictures)) {
        picturePaths.push(req.files.pictures.name);
      } 
      // If multiple files
      else {
        req.files.pictures.forEach(file => {
          picturePaths.push(file.name);
        });
      }
    } else if (req.body.picturePaths) {
      // Handle array from form data
      if (Array.isArray(req.body.picturePaths)) {
        picturePaths.push(...req.body.picturePaths);
      } else {
        // If it's a single string, parse it
        try {
          const parsedPaths = JSON.parse(req.body.picturePaths);
          if (Array.isArray(parsedPaths)) {
            picturePaths.push(...parsedPaths);
          } else {
            picturePaths.push(req.body.picturePaths);
          }
        } catch (e) {
          picturePaths.push(req.body.picturePaths);
        }
      }
    }
    
    const user = await User.findById(userId);
    
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePaths, // Now storing an array
      likes: {},
      comments: [],
    });
    
    await newPost.save();
    
    // Return all posts sorted by creation date
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};


/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('newComments')
      .sort({ createdAt: -1 });
    
    console.log('Get route hit');
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    console.log('Get route hit');
    const { userId } = req.params;
    
    const posts = await Post.find({ userId })
      .populate('newComments')
      .sort({ createdAt: -1 });
    
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate('newComments');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    


    const updatedPost = await Post.findByIdAndDelete(      id );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
