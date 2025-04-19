import mongoose from "mongoose";

const socialCommentSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    postId: {
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
    description: String,

    likes: {
      type: Map,
      of: Boolean,
    },
    replies: {
      type: Array,
      default: [],
    },
  
  },
  { timestamps: true }
);

const SocialComment = mongoose.model("SocialComment", socialCommentSchema);

export default SocialComment;
