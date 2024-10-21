import express from "express";
import { Post } from "../model/feeds.js";
import { User } from "../model/userModel.js";

const postRouter = express.Router();

postRouter.post("/:userId/create", async (req, res) => {
  const { content, visibility } = req.body;

  try {
    const newPost = new Post({
      userId: req.params.userId,
      content,
      visibility,
    });

    await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

postRouter.get("/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

postRouter.get("/:userId/feed", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendIds = user.friends.map((friend) => friend.friendId);

    const posts = await Post.find({
      $or: [
        {
          userId: req.params.userId,
          visibility: { $in: ["public", "friends"] },
        },
        { userId: { $in: friendIds }, visibility: "friends" },
        { visibility: "public" },
      ],
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default postRouter;
