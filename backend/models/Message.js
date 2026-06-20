import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true
    },

    read: {
      type: Boolean,
      default: false
    },

    hasViolation: {
      type: Boolean,
      default: false
    },

    violations: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
