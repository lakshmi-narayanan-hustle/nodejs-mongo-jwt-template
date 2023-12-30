import UserModel from "../models/userModel.js";
import { hash, compare } from "bcrypt";
import Jwt from "jsonwebtoken";
import { cloudinary } from "../config/clodinary.js";
import mongoose from "mongoose";

const createUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      throw new Error("All Fields Are Required");
    }

    const existingUser = await UserModel.findOne({
      $or: [{ userName }, { email }],
    });

    if (existingUser) {
      throw new Error("User Already Exists With This Credentials!");
    }

    const hashedPassword = await hash(password, 10);

    const newUser = new UserModel({
      userName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    res
      .status(200)
      .send({ message: "Account Created Successfully!", data: savedUser });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error("User Not Found!");
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      throw new Error("Password Doesn't Match!");
    }

    const token = Jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userName: user.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res
      .status(200)
      .send({ message: "Success!", data: { token, userId: user._id } });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (userId.toString() !== id) {
      throw new Error("You Can Only Update Your Account!");
    }

    let profileUrl = "";
    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      profileUrl = image.secure_url;
    }

    const { profilePic, ...others } = req.body;
    const updatedFields = { ...others };

    if (profileUrl) {
      updatedFields.profilePic = profileUrl;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res
      .status(200)
      .send({ message: "Updated Successfully!", data: updatedUser });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (userId.toString() !== id) {
      throw new Error("You Can Only Update Your Account!");
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User Not Found!");
    }

    const isMatch = await compare(currentPassword, user.password);

    if (!isMatch) {
      throw new Error("Current Password Doesn't Match!");
    }

    const hashedPassword = await hash(newPassword, 10);
    user.password = hashedPassword;
    user.save();
    res.status(200).send({ message: "Password Updated Successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User Not Found!");
    }
    console.log(user);
    // removing sensitive data
    const { password, friendRequests, ...userData } = user.toObject();
    res.status(200).send({ message: "Success!", data: { user: userData } });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const sendingFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; //id of the recipient
    const { userId } = req.user; //id of the current user
    if (userId.toString() === id) {
      throw new Error("You Can't Send Friend Request To Yourself!");
    }

    // checking the recipient
    const recipient = await UserModel.findById(id);
    // checking the current user
    const currentUser = await UserModel.findById(userId.toString());

    if (!currentUser || !recipient) {
      throw new Error("User Not Found!");
    }

    // checking existing friend request
    const existingRequest = recipient.friendRequests.find((request) => {
      return request.friendUser === userId.userId;
    });

    if (existingRequest) {
      throw new Error("You Have Already Sent A Friend Request!");
    }

    // checking existing friend
    const existingFriend = currentUser.friends.find((friend) => {
      return friend.friendUser === recipient._id.toString();
    });

    if (existingFriend) {
      throw new Error("You're Already A Friend to This User!");
    }

    recipient.friendRequests.push({
      friendUser: userId.toString(),
    });

    await recipient.save();

    res
      .status(200)
      .send({ message: "Friend Request Successfully Sent!", data: [] });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; //id of the recipient
    const { userId } = req.user; //id of the current user
    if (userId.toString() === id) {
      throw new Error("You Can't Accept Request To Yourself!");
    }

    // checking the recipient
    const recipient = await UserModel.findById(id);
    // checking the current user
    const currentUser = await UserModel.findById(userId.toString());

    if (!currentUser || !recipient) {
      throw new Error("User Not Found!");
    }

    const friendRequest = currentUser.friendRequests.find((request) => {
      return request.friendUser === recipient._id.toString();
    });

    if (!friendRequest) {
      throw new Error("There is No Friend Request From This User!");
    }

    const existingFriends = currentUser.friends.find((friend) => {
      return friend.friendUser === recipient._id.toString();
    });

    if (existingFriends) {
      throw new Error("You Are Already a Friend To This User!");
    }

    // accepting friend request
    currentUser.friends.push({ friendUser: id });
    recipient.friends.push({ friendUser: currentUser._id.toString() });
    // updating the friend request to approve
    friendRequest.isApproved = true;

    // save the changes to the sender and current user document

    await Promise.all([currentUser.save(), recipient.save()]);

    res.status(200).send({ message: "Friend Request Accepted!", data: [] });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getAllUserFriendRequests = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await UserModel.findById(userId.toString()).populate({
      path: "friendRequests.friendUser",
      select: "userName email",
    });

    const friendRequests = user.friendRequests || [];

    const pendingRequests = user.friendRequests.filter((request) => {
      return !request.isApproved;
    });

    res.status(200).send({ message: "Success!", data: pendingRequests });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    if (userId.toString() !== id) {
      throw new Error("You Can Delete Only Your Account!");
    }

    await UserModel.findByIdAndDelete(id);

    res.status(200).send({ message: "Account Deleted!", data: [] });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export {
  createUser,
  loginUser,
  updateUser,
  getUser,
  updateUserPassword,
  sendingFriendRequest,
  acceptFriendRequest,
  getAllUserFriendRequests,
  deleteUser,
};
