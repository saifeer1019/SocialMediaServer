import express from "express";
import { getFeedPosts, getUserPosts, likePost, deletePost } from "../controllers/posts.js";
import { createComment } from "../controllers/Comments.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/user/:userId", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);

router.delete("/:id/delete", verifyToken, deletePost);
router.post("/comment", verifyToken, createComment);


export default router;
