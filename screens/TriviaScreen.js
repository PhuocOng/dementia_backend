import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const TriviaScreen = ({ route }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const navigation = useNavigation();

  const { category, subDomain } = route.params;

  const API_BASE_URL = `http://localhost:6000`; // Replace with your local IP address
  const QUESTIONS_API_URL = `${API_BASE_URL}/api/questions?category=${category}&subDomain=${subDomain}`;
  const CHATGPT_API_KEY = "sk-wpX97RgQFsVtP3Y0jjYNRCJH7IaVsR3Vva3YFycLXkT3BlbkFJPSy3jNqwqYOe8wAKt9FG2EBUrdZiKnryCVHhkZuYcA"; // Replace with your OpenAI API key

  const generateAndSaveGPTQuestions = async () => {
    try {
      // Prepare the prompt for GPT-4
      const prompt = `
        Generate 10 trivia questions related to ${category} - ${subDomain}. 
        Each question should have four multiple-choice options and the correct answer. 
        Return in JSON array format:
        [
          {
            "question": "Your generated question?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correct_answer": "Correct Option"
          },
          ...
        ]`;
  
      // Make the request to OpenAI API
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
  
      // Parse the generated questions from the API response
      const generatedQuestions = JSON.parse(response.data.choices[0]?.message?.content.trim());
      
      // Check if questions were generated
      if (generatedQuestions && generatedQuestions.length > 0) {
        // Save questions to the database
        await axios.post(SAVE_QUESTIONS_API_URL, {
          questions: generatedQuestions,
          category: category,
          subDomain: subDomain
        });
        console.log('✅ New questions saved to database');
      } else {
        console.log('❌ No questions generated or response was empty');
      }
    } catch (error) {
      console.error('❌ Error generating/saving GPT questions:', error);
    }
  };
  

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log(QUESTIONS_API_URL)
        const response = await axios.get(QUESTIONS_API_URL);
       
        console.log('API Response:', response);

        const allQuestions = response.data.questions;

        // Select 10 random questions
        const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

        setQuestions(shuffledQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoading(false);
      }
    };

    fetchQuestions();
    generateAndSaveGPTQuestions();
  }, [category, subDomain]);

  const handleSelectAnswer = (option, index) => {
    setSelectedOption(index);
    const updatedAnswers = [...selectedAnswers, { question: questions[currentQuestionIndex].question, answer: option }];
    setSelectedAnswers(updatedAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setSelectedOption(null);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Navigate to the results/answer screen
        navigation.navigate('AnswerScreen', { selectedAnswers, questions });
      }
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {questions.length > 0 ? (
        <View>
          <Text style={styles.questionText}>{questions[currentQuestionIndex].question}</Text>
          {questions[currentQuestionIndex].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectAnswer(option, index)}
              style={[
                styles.answerButton,
                selectedOption === index && styles.selectedAnswerButton,
              ]}
            >
              <Text style={styles.answerText}>
                {String.fromCharCode(65 + index)}. {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text>No questions available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  answerButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
  selectedAnswerButton: {
    backgroundColor: '#4caf50',
  },
  answerText: {
    fontSize: 16,
  },
});

export default TriviaScreen;
