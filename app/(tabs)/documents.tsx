import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Download, Calendar, User as UserIcon, File, Activity } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { documentApi } from '../../services/api';
import { Document } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

export default function DocumentsScreen() {
  const { patient } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    if (!patient) return;
    try {
      const docs = await documentApi.getDocuments(patient.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Lab Report': '#FF3B30',
      'Radiology': '#5AC8FA',
      'Prescription': '#34C759',
      'Cardiology': '#FF6B9D',
    };
    return colors[type] || COLORS.primary;
  };

  const DocumentCard = ({ document, index }: { document: Document; index: number }) => {
    const scaleAnim = new Animated.Value(0);
    React.useEffect(() => {
      Animated.spring(scaleAnim, { toValue: 1, delay: index * 50, tension: 50, friction: 7, useNativeDriver: true }).start();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={styles.documentCard} activeOpacity={0.7}>
          <LinearGradient colors={[getDocTypeColor(document.document_type) + '08', 'transparent']} style={styles.docGradient} />
          <View style={styles.documentContent}>
            <View style={styles.documentHeader}>
              <View style={[styles.iconContainer, { backgroundColor: getDocTypeColor(document.document_type) + '15' }]}>
                <File size={20} color={getDocTypeColor(document.document_type)} strokeWidth={2.5} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentDescription}>{document.description}</Text>
              </View>
            </View>
            <View style={styles.documentDetails}>
              <View style={styles.detailRow}>
                <Calendar size={12} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{formatDate(document.uploaded_at)}</Text>
              </View>
              <View style={styles.detailRow}>
                <UserIcon size={12} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{document.uploaded_by}</Text>
              </View>
            </View>
            <View style={styles.documentFooter}>
              <View style={[styles.tagContainer, { backgroundColor: getDocTypeColor(document.document_type) + '15' }]}>
                <Text style={[styles.tagText, { color: getDocTypeColor(document.document_type) }]}>{document.document_type}</Text>
              </View>
              <View style={styles.downloadButton}>
                <Text style={styles.fileSize}>{formatFileSize(document.file_size)}</Text>
                <Download size={16} color={COLORS.white} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#20606B', '#262F82']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBackground} />
      <View style={styles.header}>
        <Activity size={32} color={COLORS.white} strokeWidth={2.5} />
        <Text style={styles.headerTitle}>Medical Documents</Text>
        <Text style={styles.headerSubtitle}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <View style={styles.documentsContainer}>
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <FileText size={64} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyStateText}>No documents yet</Text>
              <Text style={styles.emptyStateSubtext}>Your medical documents will appear here</Text>
            </View>
          ) : (
            documents.map((doc, idx) => <DocumentCard key={doc.id} document={doc} index={idx} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  header: { paddingTop: 60, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  headerTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  scrollView: { flex: 1, marginTop: -20 },
  documentsContainer: { padding: SPACING.lg, paddingTop: SPACING.xl },
  documentCard: { backgroundColor: COLORS.white, borderRadius: 20, marginBottom: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  docGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  documentContent: { padding: SPACING.md },
  documentHeader: { flexDirection: 'row', marginBottom: SPACING.md },
  iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  documentInfo: { flex: 1 },
  documentTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  documentDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  documentDetails: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  documentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagContainer: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 12 },
  fileSize: { fontSize: FONT_SIZES.xs, color: COLORS.white, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  emptyStateText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.lg },
  emptyStateSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
