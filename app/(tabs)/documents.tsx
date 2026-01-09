import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  Download,
  Calendar,
  User as UserIcon,
  File,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { documentApi } from '../../services/api';
import { Document } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Linking } from 'react-native';

const PAGE_SIZE = 8;

export default function DocumentsScreen() {
  const { patient } = useAuth();

  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [visibleDocuments, setVisibleDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = async () => {
    if (!patient) return;
    try {
      setLoading(true);
      const docs = await documentApi.getPatientDocuments();
      setAllDocuments(docs);
      setVisibleDocuments(docs.slice(0, PAGE_SIZE));
      setPage(1);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const nextDocs = allDocuments.slice(0, nextPage * PAGE_SIZE);
    if (nextDocs.length !== visibleDocuments.length) {
      setVisibleDocuments(nextDocs);
      setPage(nextPage);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocTypeColor = () => COLORS.accent1;

  /* ---------------- Skeleton ---------------- */

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonTitle} />
      </View>
      <View style={styles.skeletonLineSmall} />
      <View style={styles.skeletonFooter} />
    </View>
  );

  /* ---------------- Document Card ---------------- */

  const DocumentCard = ({ document }: { document: Document }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, []);

    const handleDownload = async (fileUrl: string) => {
      try {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) await Linking.openURL(fileUrl);
      } catch {
        Alert.alert('Error', 'Failed to open file');
      }
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.documentCard}>
          <LinearGradient
            colors={[getDocTypeColor() + '08', 'transparent']}
            style={styles.docGradient}
          />

          <View style={styles.documentContent}>
            <View style={styles.documentHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getDocTypeColor() + '15' },
                ]}
              >
                <File size={20} color={getDocTypeColor()} />
              </View>

              <View>
                <Text style={styles.documentTitle}>
                  {document.description}
                </Text>
              </View>
            </View>

            <View style={styles.documentDetails}>
              <View style={styles.detailRow}>
                <Calendar size={12} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {formatDate(document.uploaded_at)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <UserIcon size={12} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {document.uploaded_by?.split('@')[0]}
                </Text>
              </View>
            </View>

            <View style={styles.documentFooter}>
              <View
                // style={[
                //   styles.tagContainer,
                //   { backgroundColor: getDocTypeColor() + '15' },
                // ]}
              >
                {/* <Text
                  style={[
                    styles.tagText,
                    { color: getDocTypeColor() },
                  ]}
                > */}
                  {/* {document.document_type} */}
                {/* </Text> */}
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(document.file_url)}
              >
                <Text style={styles.fileSize}>
                  {formatFileSize(document.file_size)}
                </Text>
                <Download size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#20206b', '#262f82', '#9966ff']}
        style={styles.headerBackground}
      />

      <View style={styles.header}>
        <File size={32} color={COLORS.white} />
        <Text style={styles.headerTitle}>Medical Documents</Text>
        <Text style={styles.headerSubtitle}>
          {allDocuments.length} document
          {allDocuments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={loadMore}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.documentsContainer}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          ) : visibleDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={64} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>
                No documents yet
              </Text>
            </View>
          ) : (
            visibleDocuments.map((doc, idx) => (
              <DocumentCard
                key={`${doc.id}-${idx}`}
                document={doc}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerBackground: {
    position: 'absolute',
    height: 200,
    left: 0,
    right: 0,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl + 1,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
  },

  documentsContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl + 20,
  },

  documentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },

  docGradient: { ...StyleSheet.absoluteFillObject },
  documentContent: { padding: SPACING.md },

  documentHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  documentTitle: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '600',
    color: COLORS.secondary,
  },

  documentDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  detailText: {
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.secondary,
  },

  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: SPACING.sm,
  },

  tagContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
  },

  tagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },

  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
  },

  fileSize: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },

  /* Skeleton */
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.md,
  },
  skeletonTitle: {
    height: 16,
    width: '65%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },
  skeletonLineSmall: {
    height: 12,
    width: '40%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 10,
  },
  skeletonFooter: {
    height: 14,
    width: '30%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
});
