import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type PortionSize = 'Very Small' | 'Small' | 'Medium' | 'Large' | 'Very Large';
type WaterIntake = 'Less than 1 L' | '1-2 L' | '2-3 L' | 'More than 3 L';

export default function DailyLogScreen() {
  const [loading, setLoading] = useState(false);
  
  // Breakfast
  const [breakfastFood, setBreakfastFood] = useState('');
  const [breakfastPortion, setBreakfastPortion] = useState<PortionSize>('Medium');
  const [breakfastTime, setBreakfastTime] = useState('');

  // Lunch
  const [lunchFood, setLunchFood] = useState('');
  const [lunchPortion, setLunchPortion] = useState<PortionSize>('Medium');
  const [lunchVegetables, setLunchVegetables] = useState(false);
  const [lunchProtein, setLunchProtein] = useState(false);
  const [lunchFried, setLunchFried] = useState(false);
  const [lunchDessert, setLunchDessert] = useState(false);

  // Dinner
  const [dinnerFood, setDinnerFood] = useState('');
  const [dinnerPortion, setDinnerPortion] = useState<PortionSize>('Medium');
  const [dinnerTime, setDinnerTime] = useState('');
  const [dinnerAfter9, setDinnerAfter9] = useState(false);

  // Snacks
  const [hadSnacks, setHadSnacks] = useState(false);
  const [snacksDetail, setSnacksDetail] = useState('');
  const [beverages, setBeverages] = useState('None');

  // Water
  const [waterIntake, setWaterIntake] = useState<WaterIntake>('1-2 L');

  const portions: PortionSize[] = ['Very Small', 'Small', 'Medium', 'Large', 'Very Large'];
  const waterOptions: WaterIntake[] = ['Less than 1 L', '1-2 L', '2-3 L', 'More than 3 L'];
  const beverageOptions = ['None', '1 cup', '2-3 cups', 'More than 3'];

  const renderPortionSelector = (selected: PortionSize, onSelect: (size: PortionSize) => void) => (
    <View style={styles.optionsContainer}>
      {portions.map((size) => (
        <TouchableOpacity
          key={size}
          style={[styles.optionButton, selected === size && styles.optionButtonActive]}
          onPress={() => onSelect(size)}
        >
          <Text style={[styles.optionText, selected === size && styles.optionTextActive]}>
            {size}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCheckbox = (label: string, checked: boolean, onPress: () => void) => (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const handleSubmit = async () => {
    if (!breakfastFood || !lunchFood || !dinnerFood) {
      Alert.alert('Incomplete', 'Please fill in all meal details');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      const logData = {
        user_id: userId,
        log_date: format(new Date(), 'yyyy-MM-dd'),
        breakfast: {
          food: breakfastFood,
          portion: breakfastPortion,
          time: breakfastTime,
        },
        lunch: {
          food: lunchFood,
          portion: lunchPortion,
          vegetables: lunchVegetables,
          protein: lunchProtein,
          fried: lunchFried,
          dessert: lunchDessert,
        },
        dinner: {
          food: dinnerFood,
          portion: dinnerPortion,
          time: dinnerTime,
          after_9pm: dinnerAfter9,
        },
        snacks: {
          had_snacks: hadSnacks,
          details: snacksDetail,
          beverages: beverages,
        },
        water_intake: waterIntake,
      };

      await axios.post(`${BACKEND_URL}/api/daily-logs`, logData);
      
      Alert.alert('Success', 'Daily log saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setBreakfastFood('');
            setLunchFood('');
            setDinnerFood('');
            setBreakfastTime('');
            setDinnerTime('');
            setSnacksDetail('');
            setHadSnacks(false);
            setLunchVegetables(false);
            setLunchProtein(false);
            setLunchFried(false);
            setLunchDessert(false);
            setDinnerAfter9(false);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.subtitle}>{format(new Date(), 'EEEE, MMM d, yyyy')}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Breakfast Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🍳</Text>
              <Text style={styles.sectionTitle}>1. Breakfast</Text>
            </View>

            <Text style={styles.label}>What did you eat for breakfast?</Text>
            <Text style={styles.hint}>(Example: 2 idli + 1 cup sambar / 3 bread slices + omelette)</Text>
            <TextInput
              style={styles.input}
              value={breakfastFood}
              onChangeText={setBreakfastFood}
              placeholder="Enter breakfast details"
              placeholderTextColor="#999"
              multiline
            />

            <Text style={styles.label}>Quantity / Portion size:</Text>
            {renderPortionSelector(breakfastPortion, setBreakfastPortion)}

            <Text style={styles.label}>Time of breakfast:</Text>
            <TextInput
              style={styles.input}
              value={breakfastTime}
              onChangeText={setBreakfastTime}
              placeholder="e.g., 8:00 AM"
              placeholderTextColor="#999"
            />
          </View>

          {/* Lunch Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🍛</Text>
              <Text style={styles.sectionTitle}>2. Lunch</Text>
            </View>

            <Text style={styles.label}>What did you eat for lunch?</Text>
            <Text style={styles.hint}>(Mention main items clearly)</Text>
            <TextInput
              style={styles.input}
              value={lunchFood}
              onChangeText={setLunchFood}
              placeholder="Enter lunch details"
              placeholderTextColor="#999"
              multiline
            />

            <Text style={styles.label}>Quantity / Portion size:</Text>
            {renderPortionSelector(lunchPortion, setLunchPortion)}

            <Text style={styles.label}>Did it include:</Text>
            {renderCheckbox('Vegetables', lunchVegetables, () => setLunchVegetables(!lunchVegetables))}
            {renderCheckbox('Protein (Egg/Chicken/Fish/Paneer/Dal)', lunchProtein, () => setLunchProtein(!lunchProtein))}
            {renderCheckbox('Fried items', lunchFried, () => setLunchFried(!lunchFried))}
            {renderCheckbox('Dessert', lunchDessert, () => setLunchDessert(!lunchDessert))}
          </View>

          {/* Dinner Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🍲</Text>
              <Text style={styles.sectionTitle}>3. Dinner</Text>
            </View>

            <Text style={styles.label}>What did you eat for dinner?</Text>
            <TextInput
              style={styles.input}
              value={dinnerFood}
              onChangeText={setDinnerFood}
              placeholder="Enter dinner details"
              placeholderTextColor="#999"
              multiline
            />

            <Text style={styles.label}>Quantity / Portion size:</Text>
            {renderPortionSelector(dinnerPortion, setDinnerPortion)}

            <Text style={styles.label}>Time of dinner:</Text>
            <TextInput
              style={styles.input}
              value={dinnerTime}
              onChangeText={setDinnerTime}
              placeholder="e.g., 8:00 PM"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Was it after 9 PM?</Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[styles.yesNoButton, dinnerAfter9 && styles.yesNoButtonActive]}
                onPress={() => setDinnerAfter9(true)}
              >
                <Text style={[styles.yesNoText, dinnerAfter9 && styles.yesNoTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoButton, !dinnerAfter9 && styles.yesNoButtonActive]}
                onPress={() => setDinnerAfter9(false)}
              >
                <Text style={[styles.yesNoText, !dinnerAfter9 && styles.yesNoTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Snacks Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🍫</Text>
              <Text style={styles.sectionTitle}>4. Snacks & Extras</Text>
            </View>

            <Text style={styles.label}>Did you eat any snacks?</Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[styles.yesNoButton, !hadSnacks && styles.yesNoButtonActive]}
                onPress={() => setHadSnacks(false)}
              >
                <Text style={[styles.yesNoText, !hadSnacks && styles.yesNoTextActive]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoButton, hadSnacks && styles.yesNoButtonActive]}
                onPress={() => setHadSnacks(true)}
              >
                <Text style={[styles.yesNoText, hadSnacks && styles.yesNoTextActive]}>Yes</Text>
              </TouchableOpacity>
            </View>

            {hadSnacks && (
              <>
                <Text style={styles.label}>If yes, what and how much?</Text>
                <TextInput
                  style={styles.input}
                  value={snacksDetail}
                  onChangeText={setSnacksDetail}
                  placeholder="Enter snacks details"
                  placeholderTextColor="#999"
                  multiline
                />
              </>
            )}

            <Text style={styles.label}>Sugary drinks / tea / coffee?</Text>
            <View style={styles.optionsContainer}>
              {beverageOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, beverages === option && styles.optionButtonActive]}
                  onPress={() => setBeverages(option)}
                >
                  <Text style={[styles.optionText, beverages === option && styles.optionTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Water Intake Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💧</Text>
              <Text style={styles.sectionTitle}>5. Water Intake</Text>
            </View>

            <Text style={styles.label}>How much water did you drink today?</Text>
            <View style={styles.optionsContainer}>
              {waterOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, waterIntake === option && styles.optionButtonActive]}
                  onPress={() => setWaterIntake(option)}
                >
                  <Text style={[styles.optionText, waterIntake === option && styles.optionTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Submit Daily Log'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  header: {
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
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 44,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  yesNoContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  yesNoButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  yesNoTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
