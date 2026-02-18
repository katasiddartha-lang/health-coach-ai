import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [latestReport, setLatestReport] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('user_name');
    const id = await AsyncStorage.getItem('user_id');
    if (name) setUserName(name);
    if (id) {
      setUserId(id);
      await loadDashboardData(id);
    }
  };

  const loadDashboardData = async (id: string) => {
    try {
      // Fetch latest report
      const reportsRes = await axios.get(`${BACKEND_URL}/api/health-reports/${id}`);
      if (reportsRes.data && reportsRes.data.length > 0) {
        setLatestReport(reportsRes.data[0]);
      }

      // Fetch recent logs
      const logsRes = await axios.get(`${BACKEND_URL}/api/daily-logs/${id}?limit=3`);
      if (logsRes.data) {
        setRecentLogs(logsRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {userName || 'User'}! 👋</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={32} color="#3498db" />
            <Text style={styles.statValue}>{latestReport ? '1+' : '0'}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="clipboard" size={32} color="#2ecc71" />
            <Text style={styles.statValue}>{recentLogs.length}</Text>
            <Text style={styles.statLabel}>Logs (7d)</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="barbell" size={32} color="#e74c3c" />
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {latestReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Health Report</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={24} color="#3498db" />
                <Text style={styles.cardTitle}>Lab Report Analysis</Text>
              </View>
              <Text style={styles.cardDate}>
                {format(new Date(latestReport.upload_date), 'MMM d, yyyy')}
              </Text>
              {latestReport.ai_analysis ? (
                <Text style={styles.cardText} numberOfLines={4}>
                  {latestReport.ai_analysis}
                </Text>
              ) : (
                <Text style={styles.cardTextMuted}>
                  Analysis pending... Visit Reports tab to analyze.
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="add-circle" size={40} color="#3498db" />
              <Text style={styles.actionText}>Upload Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="create" size={40} color="#2ecc71" />
              <Text style={styles.actionText}>Daily Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="fitness" size={40} color="#e74c3c" />
              <Text style={styles.actionText}>Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="person" size={40} color="#f39c12" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#f39c12" />
            <Text style={styles.tipText}>
              Stay hydrated! Aim for 2-3 liters of water daily for optimal health.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  cardTextMuted: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 12,
    lineHeight: 20,
  },
});