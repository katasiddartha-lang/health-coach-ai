import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ReportsScreen() {
  const [userId, setUserId] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hfApiKey, setHfApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedReportForAnalysis, setSelectedReportForAnalysis] = useState<string | null>(null);

  const loadReports = async () => {
    const id = await AsyncStorage.getItem('user_id');
    if (id) {
      setUserId(id);
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/health-reports/${id}`);
        setReports(response.data);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        Alert.alert('File Selected', `Selected: ${result.assets[0].name}`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadReport = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a PDF file first');
      return;
    }

    setUploading(true);
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('file', {
        uri: selectedFile.uri,
        type: 'application/pdf',
        name: selectedFile.name,
      } as any);

      const response = await axios.post(
        `${BACKEND_URL}/api/health-reports/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Alert.alert('Success', 'Report uploaded successfully!');
      setSelectedFile(null);
      await loadReports();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const analyzeReport = async (reportId: string) => {
    if (!hfApiKey) {
      setSelectedReportForAnalysis(reportId);
      setShowApiKeyInput(true);
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/health-reports/analyze`, {
        report_id: reportId,
        hf_api_key: hfApiKey,
      });

      Alert.alert('Success', 'Report analyzed successfully!');
      await loadReports();
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to analyze report');
    } finally {
      setAnalyzing(false);
    }
  };

  const submitApiKeyAndAnalyze = async () => {
    if (!hfApiKey.trim()) {
      Alert.alert('Error', 'Please enter your Hugging Face API key');
      return;
    }

    if (selectedReportForAnalysis) {
      setShowApiKeyInput(false);
      await analyzeReport(selectedReportForAnalysis);
      setSelectedReportForAnalysis(null);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload New Report</Text>
          
          {selectedFile ? (
            <View style={styles.selectedFileCard}>
              <Ionicons name="document-text" size={32} color="#3498db" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(2)} KB</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={32} color="#3498db" />
              <Text style={styles.uploadText}>Select PDF Report</Text>
            </TouchableOpacity>
          )}

          {selectedFile && (
            <TouchableOpacity
              style={[styles.submitButton, uploading && styles.buttonDisabled]}
              onPress={uploadReport}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-done" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Upload Report</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* API Key Input Modal */}
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
                onPress={() => {
                  setShowApiKeyInput(false);
                  setSelectedReportForAnalysis(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={submitApiKeyAndAnalyze}
              >
                <Text style={styles.confirmButtonText}>Analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Your Reports</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubtext}>Upload your first lab report to get started</Text>
            </View>
          ) : (
            reports.map((report) => (
              <View key={report.report_id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Ionicons name="document-text" size={24} color="#3498db" />
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportDate}>
                      {format(new Date(report.upload_date), 'MMM d, yyyy')}
                    </Text>
                    <Text style={styles.reportId}>ID: {report.report_id.slice(0, 12)}...</Text>
                  </View>
                </View>

                <Text style={styles.reportExtract} numberOfLines={3}>
                  {report.extracted_text}
                </Text>

                {report.ai_analysis ? (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisLabel}>AI Analysis:</Text>
                    <Text style={styles.analysisText} numberOfLines={4}>
                      {report.ai_analysis}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
                    onPress={() => analyzeReport(report.report_id)}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="analytics" size={20} color="#fff" />
                        <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
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
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 12,
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  fileSize: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  apiKeySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    backgroundColor: '#3498db',
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
  reportsSection: {
    marginBottom: 24,
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
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  reportId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  reportExtract: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisSection: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
