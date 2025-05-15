import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminScreen = ({ navigation }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole !== 'admin') {
          Alert.alert('Access Denied', 'You must be an admin to access this screen.');
          navigation.replace('Home');
        } else {
          setRole(storedRole);
          fetchUsers();
        }
      } catch (error) {
        console.error('Error retrieving user role:', error);
        Alert.alert('Error', 'Failed to verify user role.');
        navigation.replace('Home');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:6000/admin/users');
        
        setUsers(response.data);

      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to fetch users.');
      }
    };

    checkUserRole();
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </SafeAreaView>
    );
  }

  if (role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.adminContent}>Welcome to the Admin Dashboard!</Text>
        <View style={styles.usersList}>
          {users.length === 0 ? (
            <Text style={styles.noUsersText}>No users found</Text>
          ) : (
            users.map((user) => (
              
              <TouchableOpacity
                key={user.email}
                style={styles.userCard}
                onPress={() =>
                  navigation.navigate('UserPerformance', {
                    userEmail: user.email,
                  })
                }
              >
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userStats}>Total Score: {user.totalScore || 0}</Text>
                <Text style={styles.userStats}>Attempts: {user.attempts || 0}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  adminContent: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '600',
    color: '#333',
  },
  usersList: {
    marginTop: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 15,
    color: '#555',
    marginVertical: 5,
  },
  userStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  noUsersText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
  },
});

export default AdminScreen;
