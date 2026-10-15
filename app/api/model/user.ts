import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";


export const THEME_IDS = ["dawn", "ocean", "forest", "rose", "midnight"] as const;

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    theme: { type: String, enum: THEME_IDS, default: "dawn" },
  },
  { timestamps: true }, 
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ?? mongoose.model<UserDoc>("User", userSchema);