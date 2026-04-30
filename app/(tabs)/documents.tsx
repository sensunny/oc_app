import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Image,
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
import { Document } from '../../types';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Linking } from 'react-native';

const PAGE_SIZE = 8;

export default function DocumentsScreen() {
  const { patient, documents, fetchDocuments } = useAuth();

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     Load on focus (background)
  ========================= */
  useFocusEffect(
    useCallback(() => {
      // Fetch in background if we already have documents
      if (patient) {
        fetchDocuments(true);
      }
    }, [patient, fetchDocuments])
  );

  /* =========================
     Pull to refresh
  ========================= */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments(true);
    setRefreshing(false);
  };

  /* =========================
     Pagination / Derived State
  ========================= */
  const allDocuments = documents || [];
  const visibleDocuments = allDocuments.slice(0, page * PAGE_SIZE);

  const loadMore = () => {
    if (visibleDocuments.length >= allDocuments.length) return;
    setPage(prev => prev + 1);
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
     Skeleton (ONLY if no documents yet)
  ========================= */
  const showSkeleton = !documents; // Null means not loaded yet

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
        <Image source={{ uri: LOGO_URL }} style={styles.logoImg} resizeMode="contain" />
        <View style={styles.titleRow}>
          <File size={20} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Medical Documents</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {allDocuments.length} document{allDocuments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {showSkeleton ? (
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
            <View style={styles.emptyState}>
              <FileText size={64} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>No documents yet</Text>
            </View>
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
  container: { flex: 1, backgroundColor: '#f4f5f9' },

  headerBackground: {
    position: 'absolute',
    height: 210,
    left: 0,
    right: 0,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  logoImg: {
    width: 120,
    height: 36,
    marginBottom: 14,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },

  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },

  documentsContainer: {
    padding: 20,
    paddingTop: 24,
  },

  /* Skeleton */

  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f0f1f6',
    marginRight: 14,
  },

  skeletonTitle: {
    height: 14,
    width: '65%',
    backgroundColor: '#f0f1f6',
    borderRadius: 6,
  },

  skeletonLineSmall: {
    height: 10,
    width: '40%',
    backgroundColor: '#f0f1f6',
    borderRadius: 6,
    marginBottom: 10,
  },

  skeletonFooter: {
    height: 12,
    width: '30%',
    backgroundColor: '#f0f1f6',
    borderRadius: 6,
  },

  /* Premium Brand Card */

  brandCard: {
    position: 'relative',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(238,240,248,0.9)',
  },

  brandAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.accent1,
    opacity: 0.7,
  },

  cardInner: {
    padding: 16,
    paddingLeft: 18,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  brandIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  brandSubText: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.gray,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f1f6',
    paddingTop: 10,
  },

  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  uploaderText: {
    fontSize: 11,
    color: COLORS.gray,
  },

  brandDownloadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },

  brandFileSize: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },

  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
});
