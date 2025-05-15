import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const UserPerformanceScreen = ({ route }) => {
  console.log(route.params);
  const userEmail = route.params.userEmail;
  console.log("userEmail is", userEmail);
  const [userId, setUserId] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch userId from the backend using email
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`http://localhost:6000/api/user-id?email=${userEmail}`);
        if (response.data.userId) {
          setUserId(response.data.userId);
        } else {
          console.error('User ID not found for email:', userEmail);
        }
      } catch (err) {
        console.error('Failed to fetch user ID:', err);
      }
    };

    if (userEmail) {
      fetchUserId();
    }
  }, [userEmail]);

  // Fetch user scores once userId is available
  useEffect(() => {
    const fetchUserScores = async () => {
      try {
        const response = await axios.get('http://localhost:6000/api/repeated-scores-timeline');
        console.log(response.data);

        // Extract user data for the specific userId
        const userData = response.data[userId];
        console.log("User Data:", userData);

        // Extract the scores from userData
        const userScores = userData.map(item => ({
          attempt: item.attempt,
          score: item.score, // Ensure score is a number
          status: item.status,
          timestamp: item.timestamp,
        }));

        console.log("User Scores:", userScores);

        // Sort by attempt
        userScores.sort((a, b) => a.attempt - b.attempt);
        setScores(userScores);
      } catch (err) {
        console.error('Failed to fetch scores:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserScores();
    }
  }, [userId]);

  // If data is loading, show a loading spinner
  if (loading) {
    return <ActivityIndicator size="large" color="#A78BFA" />;
  }

  // Prepare data for the chart
  const chartData = {
    labels: scores.map((s, i) => `Attempt ${i + 1}`),
    datasets: [
      {
        data: scores.map((s) => s.score), // Ensure we are mapping the score correctly
      },
    ],
  };


  console.log("Chart Data:", chartData); // Debugging the data passed to the chart

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{route.params.userName}'s Repeat Question Performance</Text>
      {scores.length === 0 ? (
        <Text>No repeated question data.</Text>
      ) : (
        <>
          {/* LineChart component to render the chart */}
          <LineChart
  data={{
    labels: scores.map((s) => s.attempt.toString()), // x-axis: 1, 2, 3...
    datasets: [
      {
        data: scores.map((s) => s.score), // y-axis: should be only 1 or 2
      },
    ],
  }}
  width={screenWidth - 40}
  height={220}
  yAxisInterval={1} // step size
  chartConfig={{
    backgroundColor: '#e0e0ff',
    backgroundGradientFrom: '#e0e0ff',
    backgroundGradientTo: '#a78bfa',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#a78bfa",
    },
  }}
  bezier={false}
  fromZero={true}
  yLabelsOffset={10}
/>
          {/* Display detailed information of each score */}
          {scores.map((s, i) => (
            <View key={i} style={styles.scoreDetails}>
              <Text style={styles.detailText}>Attempt {s.attempt}: {s.status}</Text>
              <Text style={styles.detailSubText}>Time: {new Date(s.timestamp).toLocaleString()}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

export default UserPerformanceScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreDetails: {
    marginTop: 10,
    backgroundColor: '#f3f3f3',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  detailText: {
    fontSize: 16,
  },
  detailSubText: {
    fontSize: 14,
    color: '#555',
  },
});
