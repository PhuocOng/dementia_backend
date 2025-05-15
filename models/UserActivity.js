const mongoose = require("mongoose");

const CategoryActivitySchema = new mongoose.Schema({
  category: { type: String, required: true },
  domain: { type: String, required: true },
  count: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: Date.now },
});

// Track performance on similar question pairs
const SimilarQuestionPerformanceSchema = new mongoose.Schema({
  pairId: { type: mongoose.Schema.Types.ObjectId, ref: "SimilarQuestion", required: true },
  answeredCorrectly: [Boolean], // e.g., [true, false] for question_1 and question_2
  timestamp: { type: Date, default: Date.now }
});

// New schema to track repeated question performance
const RepeatedQuestionScoreSchema = new mongoose.Schema({
  q1Text: { type: String, required: true },
  q2Text: { type: String, required: true },
  status: { type: String, enum: ['✅ Both Correct', '❌ Both Wrong', '⚠️ One Correct'], required: true },
  score: { type: Number, enum: [0, 1, 2], required: true },
  timestamp: { type: Date, default: Date.now }
});

const UserActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categories: [CategoryActivitySchema],
  similarQuestionsPerformance: [SimilarQuestionPerformanceSchema],
  repeatedQuestionScores: [RepeatedQuestionScoreSchema]  // ✅ NEW FIELD
});

UserActivitySchema.index({ userId: 1 });

const UserActivity = mongoose.model("UserActivity", UserActivitySchema);
module.exports = UserActivity;
