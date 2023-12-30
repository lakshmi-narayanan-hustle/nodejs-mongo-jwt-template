import Jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    const decodedToken = Jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decodedToken.userId);

    if (!user) {
      throw new Error("Invalid Token");
    }

    req.user = { userId: user._id };

    next();
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};

export { protect };
