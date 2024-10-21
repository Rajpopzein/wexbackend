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
      "name email "
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

userRouter.put("/:userId/add-friend", async (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;
  console.log("============================", userId, friendId);

  // Check if both userId and friendId are provided
  if (!userId || !friendId) {
    return res.status(400).json({ error: "userId and friendId are required" });
  }

  try {
    // Check if the friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: "Friend not found" });
    }

    // Add the friend to the user's friends list
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { friends: { friendId: friendId } } }, // Add friend if not already in the list
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Friend added successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

userRouter.get("/:userId/friends", async (req, res) => {
  const { userId } = req.params;

  try {

    const user = await User.findById(userId).populate(
      "friends.friendId",
      "name email"
    );

  
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.friends.length === 0) {
      return res.status(200).json({ message: "This user has no friends" });
    }

    res.status(200).json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


userRouter.get('/:userId/exclude-self-friends', async (req, res) => {
  const { userId } = req.params;

  try {
      // Find the user by ID and populate the friends array to get their friend IDs
      const user = await User.findById(userId).populate('friends.friendId');

      // If the user is not found
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Extract friend IDs
      const friendIds = user.friends.map(friend => friend.friendId._id);

      // Find all users except the requesting user and their friends
      const users = await User.find({
          _id: { $ne: userId, $nin: friendIds }
      }).select('-friends'); // Exclude the friends field in the response

      res.status(200).json(users);
  } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
  }
});


export default userRouter;
