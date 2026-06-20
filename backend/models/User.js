import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
    about: {
      type: String
    },
    password: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);