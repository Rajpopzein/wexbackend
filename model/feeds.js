import mongoose from "mongoose";

const Schema = mongoose.Schema;

import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  visibility: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "friends",
  },
  createdAt: { type: Date, default: Date.now },
});


const Post = mongoose.model("Post", PostSchema);

export { Post };
