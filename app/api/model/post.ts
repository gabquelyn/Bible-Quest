import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const MIN_POST_LENGTH = 30;
export const MAX_POST_LENGTH = 500;

const postSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Copied from the author when they post, so the feed can render without a join per row.
  username: { type: String, required: true },
  /** Local "YYYY-MM-DD" the post is for */
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  planDay: { type: Number, required: true, min: 1, max: 365 },
  /** e.g. "Genesis 1–3 · Exodus 1" */
  passage: { type: String, required: true },
  chapterCount: { type: Number, required: true, min: 1 },
  content: { type: String, required: true, minlength: MIN_POST_LENGTH, maxlength: MAX_POST_LENGTH },
  createdAt: { type: Date, default: () => new Date(), immutable: true },
});

// One post per user per day: this is what stops double-posting even if two requests race.
postSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
// "My posts", newest first.
postSchema.index({ userId: 1, _id: -1 });
// "Everyone's posts for one day", newest first. (The all-posts feed uses the built-in _id index.)
postSchema.index({ dateKey: 1, _id: -1 });

export type PostDoc = InferSchemaType<typeof postSchema>;

export const Post: Model<PostDoc> =
  (mongoose.models.Post as Model<PostDoc> | undefined) ?? mongoose.model<PostDoc>("Post", postSchema);