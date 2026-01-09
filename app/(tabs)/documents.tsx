import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
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
  const [page, setPage] = useState(1);

  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     Background SWR fetch
  ========================= */
  const loadDocuments = async (background = false) => {
    if (!patient) return;

    try {
      const docs = await documentApi.getPatientDocuments();

      setAllDocuments(prev => {
        if (prev.length === docs.length) return prev;
        return docs;
      });

      setVisibleDocuments(prev => {
        if (prev.length === 0) {
          return docs.slice(0, PAGE_SIZE);
        }
        return docs.slice(0, page * PAGE_SIZE);
      });
    } catch (error) {
      console.warn('Failed to refresh documents');
      if (!background) {
        Alert.alert('Error', 'Failed to load documents');
      }
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
    }
  };

  /* =========================
     Load on focus (background)
  ========================= */
  useFocusEffect(
    useCallback(() => {
      loadDocuments(true);
    }, [])
  );

  /* =========================
     Pull to refresh
  ========================= */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments(true);
  };

  /* =========================
     Pagination
  ========================= */
  const loadMore = () => {
    if (visibleDocuments.length >= allDocuments.length) return;

    const nextPage = page + 1;
    setVisibleDocuments(allDocuments.slice(0, nextPage * PAGE_SIZE));
    setPage(nextPage);
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

  /* =========================
     Skeleton (first load only)
  ========================= */
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

  /* =========================
     Premium Document Card
  ========================= */
  const DocumentCard = React.memo(({ document }: { document: Document }) => {
    const handleDownload = async (fileUrl: string) => {
      try {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) await Linking.openURL(fileUrl);
      } catch {
        Alert.alert('Error', 'Failed to open file');
      }
    };

    return (
      <View style={styles.brandCard}>
        <View style={styles.brandAccentStrip} />

        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.brandIconWrapper}>
              <File size={18} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle} numberOfLines={2}>
                {document.description}
              </Text>
              <Text style={styles.brandSubText}>
                {formatDate(document.uploaded_at)}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.uploaderRow}>
              <UserIcon size={12} color={COLORS.textSecondary} />
              <Text style={styles.uploaderText}>
                {document.uploaded_by?.split('@')[0]}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.brandDownloadPill}
              onPress={() => handleDownload(document.file_url)}
              activeOpacity={0.85}
            >
              <Text style={styles.brandFileSize}>
                {formatFileSize(document.file_size)}
              </Text>
              <Download size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent1]}
        style={styles.headerBackground}
      />

      <View style={styles.header}>
        <File size={32} color={COLORS.white} />
        <Text style={styles.headerTitle}>Medical Documents</Text>
        <Text style={styles.headerSubtitle}>
          {allDocuments.length} document{allDocuments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {initialLoad && visibleDocuments.length === 0 ? (
        <View style={styles.documentsContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </View>
      ) : (
        <FlatList
          data={visibleDocuments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <DocumentCard document={item} />}
          contentContainerStyle={styles.documentsContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            !initialLoad ? (
              <View style={styles.emptyState}>
                <FileText size={64} color={COLORS.gray} />
                <Text style={styles.emptyStateText}>No documents yet</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },

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

  /* Premium Brand Card */

  brandCard: {
    position: 'relative',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  brandAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent1,
  },

  cardInner: {
    padding: SPACING.md,
    paddingLeft: SPACING.md + 6,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  brandIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  brandTitle: {
    fontSize: FONT_SIZES.sm + 1,
    fontWeight: '700',
    color: COLORS.primary,
  },

  brandSubText: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },

  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  uploaderText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  brandDownloadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  brandFileSize: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
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
