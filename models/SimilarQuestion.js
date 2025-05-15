// models/SimilarQuestion.js
const mongoose = require('mongoose');

const similarQuestionSchema = new mongoose.Schema({
  category_1: String,
  domain_1: String,
  question_1: String,
  category_2: String,
  domain_2: String,
  question_2: String,
  cosine_similarity: Number
}, { collection: 'similar_question_pairs_above_threshold' }); // 👈 specify collection name

const SimilarQuestion = mongoose.model('SimilarQuestion', similarQuestionSchema);
module.exports = SimilarQuestion;
