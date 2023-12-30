import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, require: true, unique: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    profilePicture: { type: String, default: "" },
    friendRequests: [
      {
        friendUser: { type: String, require: true },
        isApproved: { type: String, default: false },
      },
    ],
    friends: [
      {
        friendUser: { type: String, require: true },
      },
    ],
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
