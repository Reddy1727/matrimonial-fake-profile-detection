import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    photo: {
      type: String   // image URL or file path
    },

    age: {
      type: Number
    },

    bio: {
      type: String
    },

    gender: {
      type: String
    },

    phone: {
      type: String
    },

    status: {
      type: String,
      enum: ["Real", "Fake", "Suspicious"],
      default: "Real"
    },

    fakeScore: {
      type: Number,   // 0 - 100%
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);