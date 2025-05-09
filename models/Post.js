import mongoose from "mongoose";

const socialPostSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    description: String,
    picturePath: String,
    picturePaths: {
      type: [String],
      default: [],
    },
    userPicturePath: String,
    likes: {
      type: Map,
      of: Boolean,
    },
    comments: {
      type: Array,
      default: [],
    },
    newComments:[{type: mongoose.Schema.Types.ObjectId, 
      ref: 'SocialComment' }]
  },
  { timestamps: true }
);

const SocialPost = mongoose.model("SocialPost", socialPostSchema);

export default SocialPost;
