import express from "express";
import { UserCred, User } from "../model/userModel.js";
import responseModel from "../view/responceView.js";
import { enctirypt, decodeEncription, jwtGeneratot } from "../common.js";
import { string, object } from "yup";

const userRouter = express.Router();

const validation = async (req, res, next) => {
  let user = object({
    name: string().required("Name is required"),
    email: string().email().required("Email is required"),
    password: string().required("Password is required"),
  });
  try {
    await user.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    return res.status(400).json(responseModel(false, err.errors));
  }
};

userRouter.post("/create_user", validation, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(responseModel(true, "User already exists"));
    }
    const user = new User({ name, email });
    await user.save();
    const encryptedPassword = await enctirypt(password);
    const userCred = new UserCred({
      user_id: user._id,
      email: email,
      password: encryptedPassword,
    });
    await userCred.save();
    return res
      .status(201)
      .json(responseModel(true, "User created successfully"));
  } catch (err) {
    console.log(err, "error in create_user");
    return res.status(500).send(responseModel(false, "Internal Server Error"));
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const existingUser = await UserCred.findOne({ email });
    if (!existingUser) {
      return res.status(400).json(responseModel(true, "User not found"));
    }
    const pwd = await decodeEncription(password, existingUser.password);
    if (existingUser && pwd) {
      const userdata = await User.findOne({ email });
      const token = jwtGeneratot({ data: userdata });
      return res
        .status(200)
        .json(responseModel(true, "Login successful", { token: token }));
    }
    return res.status(400).json(responseModel(false, "Invalid credentials"));
  } catch (err) {
    console.log(err, "error in create_user");
    return res.status(500).send(responseModel(false, "Internal Server Error"));
  }
});

userRouter.post("/:userId/add-friend", async (req, res) => {
  const { friendId } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isAlreadyFriend = user.friends.some((friend) =>
      friend.friendId.equals(friendId)
    );
    if (isAlreadyFriend)
      return res.status(400).json({ message: "Friend already added" });

    user.friends.push({ friendId });
    await user.save();
    res.status(200).json({ message: "Friend added successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.get("/:userId/friends", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "friends.friendId",
      "username email"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.get("/all-users/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("============================", userId);
  try {
    const users = await User.find({ _id: { $ne: userId } });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default userRouter;
