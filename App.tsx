import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoriesScreen from "./screens/CategoriesScreen";
import TriviaScreen from "./screens/TriviaScreen";
import AnswerScreen from "./screens/AnswerScreen";
import RandomQuestionsScreen from "./screens/RandomQuestionsScreen";
import AdminScreen from "./screens/AdminScreen";
import UserPerformanceScreen from "./screens/UserPerformanceScreen";

const Stack = createStackNavigator();

const App = () => (
    <SafeAreaProvider>
  <View style={styles.container}>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AdminScreen" component={AdminScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Trivia" component={TriviaScreen} />
        <Stack.Screen name="AnswerScreen" component={AnswerScreen} />
        <Stack.Screen name="RandomQuestionsScreen" component={RandomQuestionsScreen} />
        <Stack.Screen name="UserPerformance" component={UserPerformanceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </View>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // or your preferred background
  },
});

export default App;
