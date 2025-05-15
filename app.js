const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const axios = require("axios");
const crypto = require("crypto");
const Trivia = require("./models/TriviaCategory");
const UserActivity = require("./models/UserActivity");
const SimilarQuestion = require('./models/SimilarQuestion');

const User = require("./models/User");


const app = express();


// Middleware
app.use(cors());
app.use(express.json());

app.use(bodyParser.json());

const authMiddleware = async (req, res, next) => {
  const authorizationHeader = req.header("Authorization");
  console.log("Authorization Header:", authorizationHeader); // Log header

  if (!authorizationHeader) {
    return res.status(401).json({ message: "Unauthorized: Missing Authorization header" });
  }

  const sessionToken = authorizationHeader.replace("Bearer ", "").trim();
  console.log("Session Token:", sessionToken); // Log token

  if (!sessionToken) {
    return res.status(401).json({ message: "Unauthorized: Missing session token" });
  }

  try {
    const user = await User.findOne({ sessionToken });
    console.log("User Found:", user); // Log user data

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Invalid session token" });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (err) {
    console.error("Error in authMiddleware:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



//Categories
// Categories with keywords for each sub-category
const categories = {
  entertainment: {
    bollywood: {
      movies: ['bollywood movies', 'film', 'cinema', 'director', 'actor', 'actress', 'screenplay'],
      actors: ['bollywood actors', 'celebrity', 'star', 'actor', 'actress'],
      songs: ['bollywood songs', 'music', 'singer', 'lyrics', 'album']
    },
    tollywood: ['tollywood', 'south indian film', 'telugu movie', 'tamil cinema'],
    indianMusic: ['indian music', 'singer', 'composer', 'album', 'classical music', 'pop', 'instrumental'],
    indianTVShows: ['tv show', 'indian television', 'soap opera', 'reality show'],
    sports: {
      cricket: ['cricket', 'bat', 'ball', 'wicket', 'batsman', 'bowler', 'tournament'],
      otherSports: ['football', 'soccer', 'tennis', 'badminton', 'hockey', 'sports event']
    }
  },
  politics: {
    national: ['government', 'ministry', 'policy', 'cabinet', 'parliament', 'national law'],
    northIndian: ['north india politics', 'state government', 'chief minister', 'legislature'],
    southIndian: ['south india politics', 'andhra pradesh', 'karnataka', 'tamil nadu'],
    freedomMovement: ['independence', 'freedom fighters', 'british rule', 'indian freedom movement']
  },
  history: {
    ancientIndia: ['ancient india', 'vedic period', 'maurya empire', 'gupta dynasty', 'harappan'],
    medievalIndia: ['medieval india', 'mughal empire', 'sultanate', 'rajput', 'maratha'],
    modernIndia: ['modern india', 'british india', 'post-independence', 'partition', 'indian history']
  },
  geography: {
    statesAndCapitals: ['state capital', 'indian states', 'capital city', 'map of india'],
    riversAndMountains: ['rivers of india', 'mountains', 'himalayas', 'ganges', 'narmada'],
    nationalParks: ['national park', 'wildlife sanctuary', 'forest reserve', 'nature park'],
    librariesAndStatues: ['indian library', 'statue', 'monument', 'historical site']
  },
  generalKnowledge: {
    economy: ['indian economy', 'gdp', 'inflation', 'stock market', 'trade', 'finance'],
    festivals: ['festival', 'celebration', 'diwali', 'holi', 'eid', 'indian tradition'],
    literature: ['literature', 'books', 'author', 'poet', 'novel', 'indian writer'],
    scienceAndTechnology: ['science', 'technology', 'innovation', 'research', 'engineering']
  },
  mythology: {
    hindu: ['hindu mythology', 'god', 'goddess', 'epic', 'mahabharata', 'ramayana'],
    otherReligions: ['buddhism', 'jainism', 'sikhism', 'christianity', 'islam', 'mythology']
  },
  currentAffairs: {
    economicAffairs: ['economy', 'budget', 'policy', 'investment', 'indian market'],
    infrastructure: ['infrastructure', 'development', 'roads', 'transportation', 'urban planning'],
    internationalRelations: ['foreign policy', 'diplomacy', 'alliance', 'india-un relations'],
    healthAndEnvironment: ['health', 'environment', 'climate change', 'pollution', 'conservation']
  }
};
// Utility: Categorize Articles
function categorizeArticle(article) {
  const content = `${article.title} ${article.snippet}`.toLowerCase();

  for (let mainCategory in categories) {
    for (let subCategory in categories[mainCategory]) {
      const keywords = categories[mainCategory][subCategory];
      if (Array.isArray(keywords) && keywords.filter((keyword) => content.includes(keyword)).length >= 2) {
        return `${mainCategory}/${subCategory}`;
      }
    }
  }
  return "others";
}

// Sample route for base
app.get("/", (req, res) => {
  res.json({ message: "Backend running on Vercel! Base route /" });
});

// Sample route
app.get("/api", (req, res) => {
  res.json({ message: "Backend running on Vercel!" });
});

app.post("/api/add-questions", async (req, res, next) => {
  console.log(req.body);

  const { category, domain, questions } = req.body;

  try {
    let triviaCategory = await Trivia.findOne({ category, domain });

    if (!triviaCategory) {
      triviaCategory = new Trivia({
        category,
        domain,
        questions: [],
      });
    }

    questions.forEach((question) => {
      const newQuestion = {
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer || question.correctAnswer,
        subDomain: question.subDomain,
      };

      triviaCategory.questions.push(newQuestion); // push as object, not string
    });

    await triviaCategory.save();

    res.json({
      status: "success",
      message: "Questions added successfully!",
      data: triviaCategory,
    });
  } catch (error) {
    console.error("Error saving questions:", error);
    next(error);
  }
});


//Endpoint for user preferences
app.get("/api/user-preferences", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id; // From authMiddleware
    console.log("Fetching preferences for User ID:", userId);

    const activity = await UserActivity.findOne({ userId });
    if (!activity || activity.categories.length === 0) {
      return res.json({ preferences: [] }); // Return empty preferences if no activity found
    }

    const preferences = activity.categories.map((category) => ({
      category: category.category,
      subDomain: category.domain,
      count: category.count,
    }));

    // Sort preferences by count (most frequent first)
    preferences.sort((a, b) => b.count - a.count);

    res.json({ preferences });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    next(err);
  }
});

// Endpoint to Log User Activity
app.post("/api/log-activity", authMiddleware, async (req, res, next) => {
  const { category, domain } = req.body;
  console.log("req.body", req.body)
  console.log("category", category)
  console.log("domain", domain)
  if (!category || !domain) {
    return res.status(400).json({ 
      status: "error", 
      message: "Both category and domain are required." 
    });
  }

  try {
    const userId = req.user._id; // Get user ID from authMiddleware
    let activity = await UserActivity.findOne({ userId });

    if (!activity) {
      activity = new UserActivity({ userId, categories: [] });
    }

    const categoryIndex = activity.categories.findIndex(
      (c) => c.category === category && c.domain === domain
    );

    if (categoryIndex >= 0) {
      activity.categories[categoryIndex].count += 1;
      activity.categories[categoryIndex].lastPlayed = new Date();
    } else {
      activity.categories.push({ 
        category, 
        domain,
        count: 1, 
        lastPlayed: new Date() 
      });
    }

    await activity.save();

    res.json({ status: "success", message: "Activity logged successfully." });
  } catch (error) {
    console.error("Error logging activity:", error);
    next(error);
  }
});

// Questions Fetch Endpoint
app.get("/api/questions", async (req, res, next) => {
  const { category, subDomain } = req.query;

  if (!category || !subDomain) {
    return res.status(400).json({
      status: "error",
      message: "Category and subDomain are required parameters.",
    });
  }
  try {
    const triviaCategory = await Trivia.findOne({ category, domain: subDomain });

    if (!triviaCategory || !triviaCategory.questions.length) {
      return res.status(404).json({
        status: "error",
        message: "No questions found for the specified category and subDomain.",
      });
    }

    res.json({
      status: "success",
      questions: triviaCategory.questions,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
});

app.get('/api/random-questionss', async (req, res) => {
  const { categories } = req.query;

  if (!categories) {
    return res.status(400).json({ message: 'Categories are required.' });
  }

  const categoryList = categories.split(',');

  try {
    // Step 1: Fetch 8 random questions from Trivia collection
    const questions = await Trivia.aggregate([
      { $match: { category: { $in: categoryList } } },
      { $unwind: '$questions' },
      { $sample: { size: 8 } },
      { $project: { _id: 0, question: '$questions' } },
    ]);

    // Step 2: Fetch all similar question pairs
    const similarPairs = await SimilarQuestion.find();

    // Step 3: Select ONE random similar question pair
    const randomIndex = Math.floor(Math.random() * similarPairs.length);
    const randomPair = similarPairs[randomIndex];

    // Step 4: Extract question texts
    const similarQuestionTexts = [randomPair.question_1, randomPair.question_2];
    console.log('Fetched similar questions:', similarQuestionTexts);

    // Step 5: Find full question objects that match the similar question texts
    const similarQuestionDocs = await Trivia.aggregate([
      { $unwind: '$questions' },
      { $match: { 'questions.question': { $in: similarQuestionTexts } } },
      { $project: { _id: 0, question: '$questions' } }
    ]);

    // Step 6: Combine and send
    const finalQuestions = [...questions.map(q => q.question), ...similarQuestionDocs.map(q => q.question)];

    res.json({ questions: finalQuestions });
  } catch (error) {
    console.error('Error fetching random or similar questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions.' });
  }
});


app.get('/api/random-questionsss', async (req, res) => {
  const { categories } = req.query;

  if (!categories) {
    return res.status(400).json({ message: 'Categories are required.' });
  }

  const categoryList = categories.split(',');

  try {
    // Step 1: Fetch 8 random questions
    const randomQuestions = await Trivia.aggregate([
      { $match: { category: { $in: categoryList } } },
      { $unwind: '$questions' },
      { $sample: { size: 8 } },
      { $project: { _id: 0, question: '$questions' } },
    ]);

    // Step 2: Fetch all similar question pairs
    const similarPairs = await SimilarQuestion.find();
    const randomPair = similarPairs[Math.floor(Math.random() * similarPairs.length)];
    const similarQuestionTexts = [randomPair.question_1, randomPair.question_2];

    // Step 3: Get full question objects for similar questions
    const similarQuestionDocs = await Trivia.aggregate([
      { $unwind: '$questions' },
      { $match: { 'questions.question': { $in: similarQuestionTexts } } },
      { $project: { _id: 0, question: '$questions' } }
    ]);

    // Step 4: Combine all questions
    const combinedQuestions = [...randomQuestions.map(q => q.question), ...similarQuestionDocs.map(q => q.question)];

    // Step 5: Identify indexes of similar questions in the final array
    const similarPairIndices = [];
    for (let i = 0; i < combinedQuestions.length; i++) {
      if (similarQuestionTexts.includes(combinedQuestions[i].question)) {
        similarPairIndices.push(i);
      }
    }
    console.log(similarPairIndices)
    // Step 6: Respond with questions + similar pair index info
    res.json({
      questions: combinedQuestions,
      similarPairIndices // e.g., [8, 9]
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions.' });
  }
});



app.get('/api/random-questions', async (req, res) => {
  const { categories } = req.query; // Comma-separated list of categories

  if (!categories) {
    return res.status(400).json({ message: 'Categories are required.' });
  }

  const categoryList = categories.split(',');

  try {
    // Find questions for the specified categories
    const questions = await Trivia.aggregate([
      { $match: { category: { $in: categoryList } } },
      { $unwind: '$questions' },
      { $sample: { size: 10 } }, // Select 8 random questions
      { $project: { _id: 0, question: '$questions' } },
    ]);

    res.json({ questions: questions.map(q => q.question) });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions.' });
  }
});



app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userActivities = await UserActivity.findOne({ userId: user._id });
    
    // Manually attach "activities" field
    if (userActivities) {
      user._doc.activities = userActivities.categories;
    } else {
      user._doc.activities = []; // empty if no activity found
    }

    res.json({user: user});
  } catch (error) {
    console.error("Error fetch specific user:", error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
})

// GET /api/admin/users
// GET /api/admin/users
app.get('/admin/users', async (req, res) => {
  try {
    const users = await UserActivity.find()
      .populate('userId', 'name email') // populate basic user info
      .lean();

    const usersWithScores = users.map(user => {
      const repeatedScores = user.repeatedQuestionScores || [];
      const totalScore = repeatedScores.reduce((sum, item) => sum + (item.score || 0), 0);
      const attempts = repeatedScores.length;

      return {
        _id: user._id,
        name: user.userId?.name || 'N/A',
        email: user.userId?.email || 'N/A',
        totalScore,
        attempts,
      };
    });

    res.json(usersWithScores);
  } catch (error) {
    console.error('Admin fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});



if (process.env.NODE_ENV !== "test") {
  mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));
}

// routes/similarQuestions.js or inside your main server file
app.get('/api/similar-questions', async (req, res) => {
  try {
    const similarQuestions = await SimilarQuestion.find(); // 👈 fetches all documents, no filter
    res.json(similarQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching similar questions');
  }
});


// POST /api/user-activity/repeated-score
app.post('/api/repeated-score', async (req, res) => {
  const { userId, q1Text, q2Text, status, score } = req.body;

  if (!userId || !q1Text || !q2Text || !status || score === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const update = {
      $push: {
        repeatedQuestionScores: {
          q1Text,
          q2Text,
          status,
          score,
          timestamp: new Date()
        }
      }
    };

    const userActivity = await UserActivity.findOneAndUpdate(
      { userId },
      update,
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Score saved', userActivity });
  } catch (error) {
    console.error('Error saving repeated question score:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get("/api/repeated-scores", async (req, res) => {
  try {
    const allActivities = await UserActivity.find({}, "userId repeatedQuestionScores").populate("userId", "name email");
    res.json(allActivities);
  } catch (error) {
    console.error("Error fetching all repeated scores:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/repeated-scores/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userActivity = await UserActivity.findOne({ userId }, "repeatedQuestionScores");
    if (!userActivity) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(userActivity.repeatedQuestionScores);
  } catch (error) {
    console.error("Error fetching user scores:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// GET /api/repeated-scores-timeline
app.get("/api/repeated-scores-timeline", async (req, res) => {
  try {
    const allActivities = await UserActivity.find({}, "userId repeatedQuestionScores").populate("userId", "name email");

    const timelineMap = {};

    allActivities.forEach(activity => {
      if (activity.userId && Array.isArray(activity.repeatedQuestionScores)) {
        const userId = activity.userId._id.toString();

        // Each entry becomes a "timeline" point (indexed)
        timelineMap[userId] = activity.repeatedQuestionScores.map((entry, index) => ({
          attempt: index + 1,
          score: entry.score,
          status: entry.status,
          q1Text: entry.q1Text,
          q2Text: entry.q2Text,
          timestamp: entry.timestamp,
        }));
      }
    });

    res.json(timelineMap);
  } catch (error) {
    console.error("Error creating repeated scores timeline:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/user-id", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ userId: user._id });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

module.exports = app; // Export app for Vercel, testing