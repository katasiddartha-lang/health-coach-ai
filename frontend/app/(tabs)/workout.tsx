import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function WorkoutScreen() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [hfApiKey, setHfApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const loadWorkoutPlans = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (userId) {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/workout-plans/${userId}`);
        setWorkoutPlans(response.data);
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const generateWorkoutPlan = async () => {
    if (!hfApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('hf_api_key', hfApiKey);

      const response = await axios.post(
        `${BACKEND_URL}/api/workout-plans/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Alert.alert('Success', 'New workout plan generated!');
      await loadWorkoutPlans();
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const submitApiKeyAndGenerate = async () => {
    if (!hfApiKey.trim()) {
      Alert.alert('Error', 'Please enter your Hugging Face API key');
      return;
    }

    setShowApiKeyInput(false);
    await generateWorkoutPlan();
  };

  const openExerciseInfo = (exerciseName: string) => {
    // Search for exercise on YouTube
    const query = encodeURIComponent(`${exerciseName} exercise how to`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  useEffect(() => {
    loadWorkoutPlans();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Plans</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateWorkoutPlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* API Key Input */}
      {showApiKeyInput && (
        <View style={styles.apiKeySection}>
          <Text style={styles.apiKeyTitle}>Hugging Face API Key Required</Text>
          <Text style={styles.apiKeySubtitle}>
            Get your free API key from huggingface.co/settings/tokens
          </Text>
          <TextInput
            style={styles.apiKeyInput}
            value={hfApiKey}
            onChangeText={setHfApiKey}
            placeholder="Enter your Hugging Face API key"
            placeholderTextColor="#999"
            secureTextEntry
          />
          <View style={styles.apiKeyButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowApiKeyInput(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={submitApiKeyAndGenerate}
            >
              <Text style={styles.confirmButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e74c3c" />
          </View>
        ) : workoutPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>No workout plans yet</Text>
            <Text style={styles.emptySubtext}>
              Generate your first personalized workout plan based on your daily logs
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={generateWorkoutPlan}
            >
              <Ionicons name="fitness" size={24} color="#fff" />
              <Text style={styles.emptyButtonText}>Generate Workout Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workoutPlans.map((plan) => (
            <View key={plan.plan_id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planHeaderLeft}>
                  <Ionicons name="calendar" size={24} color="#e74c3c" />
                  <View style={styles.planHeaderInfo}>
                    <Text style={styles.planDate}>
                      {format(new Date(plan.plan_date), 'EEEE, MMM d')}
                    </Text>
                    <Text style={styles.planId}>ID: {plan.plan_id.slice(0, 12)}...</Text>
                  </View>
                </View>
                <View style={styles.planBadge}>
                  <Ionicons name="flash" size={16} color="#fff" />
                </View>
              </View>

              {/* AI Recommendations */}
              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
                <Text style={styles.recommendationsText}>{plan.recommendations}</Text>
              </View>

              {/* Exercises */}
              {plan.exercises && plan.exercises.length > 0 && (
                <View style={styles.exercisesSection}>
                  <Text style={styles.exercisesTitle}>Exercises ({plan.exercises.length})</Text>
                  {plan.exercises.map((exercise: any, index: number) => (
                    <TouchableOpacity
                      key={exercise.id || index}
                      style={styles.exerciseCard}
                      onPress={() => openExerciseInfo(exercise.name)}
                    >
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.description && (
                          <Text style={styles.exerciseDescription} numberOfLines={2}>
                            {exercise.description.replace(/<[^>]*>/g, '')}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="play-circle" size={32} color="#e74c3c" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.planFooter}>
                <Ionicons name="information-circle" size={16} color="#7f8c8d" />
                <Text style={styles.planFooterText}>
                  Tap any exercise to watch video tutorial
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  apiKeySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  apiKeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  apiKeySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  apiKeyInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  apiKeyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planHeaderInfo: {
    marginLeft: 12,
  },
  planDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  planId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  planBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsSection: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  recommendationsText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  exercisesSection: {
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  planFooterText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});
