import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';



const AnswerScreen = ({ route, navigation }) => {
  const { selectedAnswers = [], questions = [], similarPairIndices = [] } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [pairScores, setPairScores] = useState([]);
  const [score, setScore] = useState(0);


  const CHATGPT_API_KEY = 'sk-wpX97RgQFsVtP3Y0jjYNRCJH7IaVsR3Vva3YFycLXkT3BlbkFJPSy3jNqwqYOe8wAKt9FG2EBUrdZiKnryCVHhkZuYcA'; // Replace with your actual key

  useEffect(() => {
    
  const saveScoreWithUserId = async () => {
    const userId = await AsyncStorage.getItem("userId");

    console.log('Calculating pair scores...');

    if (Array.isArray(similarPairIndices) && similarPairIndices.length === 2) {
      const [index1, index2] = similarPairIndices;
      console.log(index1, index2)
      const answer1 = selectedAnswers[index1];
      const answer2 = selectedAnswers[index2];
      console.log("answer sare", answer1,answer2)

      if (answer1 && answer2) {
        const correct1 = (answer1.answer === answer1.question.correct_answer) || (answer1.answer === answer1.question.correctAnswer);
        const correct2 = (answer2.answer === answer2.question.correct_answer) || (answer2.answer === answer2.question.correctAnswer);

        const bothCorrect = correct1 && correct2;
        const bothWrong = !correct1 && !correct2;

        console.log(`Answer 1: ${answer1.answer}, Correct 1: ${answer1.question.correct_answer} ${answer1.question.correctAnswer } `);
        console.log(`Answer 2: ${answer2.answer}, Correct 2: ${answer2.question.correct_answer} ${answer2.question.correctAnswer }`);

        let scoreIncrement = 0;
        if (bothCorrect) scoreIncrement = 2;
        else if (!bothWrong) scoreIncrement = 1;

        if (scoreIncrement > 0) {
          setScore((prevScore) => prevScore + scoreIncrement);
          console.log(`Score increased by ${scoreIncrement}`);
        }

        try {

          if (!userId) {
            console.error("❌ User ID not found in storage.");
            return;
          }

          const pairData = {
            userId,
            q1Text: questions[index1]?.question || 'No question text for Q1',
            q2Text: questions[index2]?.question || 'No question text for Q2',
            status: bothCorrect
              ? '✅ Both Correct'
              : bothWrong
              ? '❌ Both Wrong'
              : '⚠️ One Correct',
            score: scoreIncrement,
          };

          setPairScores([pairData]);

          axios
            .post('http://localhost:6000/api/repeated-score', pairData)
            .then(res => console.log('✅ Score saved:', res.data))
            .catch(err => console.error('❌ Error saving score:', err));
        } catch (err) {
          console.error("❌ Failed to load user ID from AsyncStorage:", err);
        }

      } else {
        console.log('One or both answers are missing.');
      }
    } else {
      console.log('Invalid similarPairIndices format:', similarPairIndices);
    }
  };

  saveScoreWithUserId();
}, [similarPairIndices, selectedAnswers, questions]);


  
  

  // Fetch description for the current question
  useEffect(() => {
    if (questions[currentIndex] && selectedAnswers[currentIndex]) {
      fetchDescription(
        questions[currentIndex].question,
        selectedAnswers[currentIndex].answer,
        questions[currentIndex].correctAnswer
      );
    } else {
      setDescription('No data available for this question.');
    }
  }, [currentIndex]);

  const fetchDescription = async (question, userAnswer, correctAnswer) => {
    setLoading(true);
    try {
      const prompt = `Provide a concise 3-line description for the following trivia question: "${question}". 
User's answer: "${userAnswer}".
Correct answer: "${correctAnswer}".
Explain why the correct answer is correct and provide brief context.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CHATGPT_API_KEY}`,
          },
        }
      );

      const generatedText = response.data.choices[0]?.message?.content.trim();
      setDescription(generatedText || 'Could not generate a description at this time.');
    } catch (error) {
      console.error('Error fetching description:', error);
      setDescription('Error generating description. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDescription('');
    } else {
      Alert.alert('Quiz Completed', 'You have completed the quiz. Redirecting to the homepage.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
         <View style={styles.scoreContainer}>
      <Text style={styles.scoreTitle}>🎯 Current Score: {score}</Text>
    </View>

      <View style={styles.pairSummary}>
        <Text style={styles.summaryTitle}>🔁 Similar Question Pair Scores</Text>
        {pairScores && pairScores.length > 0 ? (
          pairScores.map((pair, idx) => (
            <View key={idx} style={styles.pairItem}>
              <Text style={styles.pairText}>{pair?.q1Text || 'No Q1 Text'}</Text>
              <Text style={styles.pairText}>{pair?.q2Text || 'No Q2 Text'}</Text>
              <Text style={styles.pairStatus}>{pair?.status || 'No status'}</Text>
            </View>
          ))
        ) : (
          <Text>No pairs available to display.</Text>
        )}
      </View>

      {questions[currentIndex] ? (
        <>
          <Text style={styles.questionHeader}>Question:</Text>
          <Text style={styles.questionText}>{questions[currentIndex].question}</Text>
          <Text style={styles.correctAnswerText}>
            ✅ Correct Answer: {questions[currentIndex].correctAnswer}
          </Text>
          <Text style={styles.userAnswerText}>
            🧠 Your Answer: {selectedAnswers[currentIndex]?.answer || 'No answer provided'}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Text style={styles.description}>{description}</Text>
          )}

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  scoreContainer: {
    backgroundColor: '#e6f7ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007BFF',
    textAlign: 'center',
  },
  pairSummary: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 16,
    marginVertical: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#444',
  },
  pairItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  pairText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  pairStatus: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#888',
  },
  questionHeader: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#222',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 6,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 4,
  },
  userAnswerText: {
    fontSize: 16,
    color: '#0069d9',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    backgroundColor: '#fefefe',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    marginVertical: 10,
  },
  nextButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 25,
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});


export default AnswerScreen;
