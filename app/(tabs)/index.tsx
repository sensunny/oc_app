import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Animated,
  AppState,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Users,
  Phone,
  Calendar,
  Shield,
  VenusAndMars,
  IdCard,
  Play,
  X,
} from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, LOGO_URL } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_CARD_WIDTH = SCREEN_WIDTH * 0.76;
const VIDEO_CARD_SPACING = SPACING.md;

export default function HomeScreen() {
  const { patient, getPatient, loading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const playerRef = useRef<any>(null);

  // AppState and navigation hooks for video control
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState !== 'active' && selectedVideo) {
        setIsPlaying(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [selectedVideo]);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
      
      // Stop video when navigating away from screen
      return () => {
        if (selectedVideo) {
          setIsPlaying(false);
          setSelectedVideo(null);
        }
      };
    }, [selectedVideo])
  );

  const loadPatientData = async () => {
    try {
      setLoading(true);
      await getPatient();
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const safeValue = (value?: string | null) => {
    if (!value || value === 'undefined' || value === 'null') return '-';
    return String(value);
  };

  const getAge = (dob?: string) => {
    if (!dob) return '-';
    const date = new Date(dob);
    if (isNaN(date.getTime())) return '-';
    const age = new Date().getFullYear() - date.getFullYear();
    return age > 0 ? `${age} yrs` : '-';
  };

  const formatDOB = (dob?: string) => {
    if (!dob) return '-';
    const date = new Date(dob);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  function combineAddress({ govtIdNum }: { govtIdNum?: string }) {
    return safeValue(govtIdNum);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  // Video data
  const videoSection = patient?.otherData?.homepageYoutubeVideos || {};
  const videos = Array.isArray(videoSection.videos) ? videoSection.videos : [];
  const hasVideos = videos.length > 0;

  const openVideo = (video: { title: string; url: string }) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const closeVideo = () => {
    setIsPlaying(false);
    setSelectedVideo(null);
  };

  // Extract video ID from different YouTube URL formats
  const getVideoId = (url: string) => {
    // Handle embed URLs
    if (url.includes('/embed/')) {
      return url.split('/embed/')[1]?.split('?')[0] || '';
    }
    // Handle watch URLs
    if (url.includes('watch?v=')) {
      return url.split('watch?v=')[1]?.split('&')[0] || '';
    }
    // Handle youtu.be URLs
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    // Handle direct video ID
    return url;
  };

  // SkeletonLoader (your original code - kept as-is)
  const SkeletonLoader = () => {
    const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const SkeletonBox = ({ width, height, borderRadius = 8, style }: {
      width: number;
      height: number;
      borderRadius?: number;
      style?: any;
    }) => (
      <Animated.View
        style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius, opacity: pulseAnim }, style]}
      />
    );

    const CardSkeleton = () => (
      <View style={styles.infoCard}>
        <View style={styles.iconContainer}>
          <SkeletonBox width={24} height={24} borderRadius={12} style={{ backgroundColor: '#dfedf6' }} />
        </View>
        <View style={styles.infoContent}>
          <SkeletonBox width={80} height={12} style={{ marginBottom: 6, backgroundColor: '#dfedf6' }} />
          <SkeletonBox width={150} height={16} style={{ backgroundColor: '#dfedf6' }} />
        </View>
      </View>
    );

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#20206b', '#262f82', '#9966ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />

        <View style={styles.headerContent}>
          <View style={styles.logoSmallContainer}>
            <Image source={{ uri: LOGO_URL }} style={styles.logoSmall} resizeMode="contain" />
          </View>
          <View style={styles.welcomeSection}>
            <SkeletonBox width={100} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width={200} height={32} style={{ marginBottom: 12 }} />
            <SkeletonBox width={120} height={24} borderRadius={20} />
          </View>
        </View>

        <View style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.quickStatsSection}>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatCard}>
                  <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 8, backgroundColor: '#f0f0f0' }} />
                  <SkeletonBox width={40} height={24} style={{ marginBottom: 4, backgroundColor: '#f0f0f0' }} />
                  <SkeletonBox width={30} height={12} style={{ backgroundColor: '#f0f0f0' }} />
                </View>
                <View style={styles.quickStatCard}>
                  <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 8, backgroundColor: '#f0f0f0' }} />
                  <SkeletonBox width={40} height={24} style={{ marginBottom: 4, backgroundColor: '#f0f0f0' }} />
                  <SkeletonBox width={30} height={12} style={{ backgroundColor: '#f0f0f0' }} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <SkeletonBox width={150} height={24} style={{ marginBottom: 16, backgroundColor: '#e0e0e0' }} />
              <View style={styles.cardsContainer}>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const isLoading = loading || isAuthLoading;

  if (isLoading && !patient) {
    return <SkeletonLoader />;
  }

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No patient data available</Text>
      </View>
    );
  }

  const QuickStatCard = ({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={styles.quickStatCard}>
      <View style={[styles.quickStatIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );

  const InfoCard = ({ icon: Icon, label, value }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#20206b" strokeWidth={2.5} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  const VideoCard = ({ video }: { video: { title: string; url: string } }) => {
    const videoId = getVideoId(video.url);
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    return (
      <TouchableOpacity
        style={styles.videoCard}
        activeOpacity={0.85}
        onPress={() => openVideo(video)}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.9)']}
          style={styles.videoCardGradient}
        >
          <View style={styles.thumbnailContainer}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={[styles.thumbnail, { backgroundColor: '#e2e8f0' }]} />
            )}
            <LinearGradient
              colors={['rgba(32,32,107,0.2)', 'rgba(32,32,107,0.5)']}
              style={styles.playIconOverlay}
            >
              <View style={styles.playIconContainer}>
                <Play size={44} color="white" fill="white" />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.videoTextContainer}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {video.title}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient
          colors={['#20206b', '#262f82', '#9966ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoSmallContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logoSmall} resizeMode="contain" />
            </View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.patientName}>{patient.patient_name}</Text>
              <View style={styles.idBadge}>
                <Shield size={14} color="#20206b" strokeWidth={3} />
                <Text style={styles.patientId}>Hospital ID: {patient.patient_id}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.quickStatsSection}>
            <View style={styles.quickStatsGrid}>
              <QuickStatCard icon={Users} label="Age" value={getAge(patient.date_of_birth)} color="#9966ff" />
              <QuickStatCard icon={VenusAndMars} label="Gender" value={safeValue(patient.gender)} color="#262f82" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.cardsContainer}>
              <InfoCard icon={User} label="Full Name" value={safeValue(patient.patient_name)} />
              <InfoCard icon={Calendar} label="Date of Birth" value={formatDOB(patient.date_of_birth)} />
              <InfoCard icon={Phone} label="Mobile Number" value={safeValue(patient.phone_number)} />
              <InfoCard icon={IdCard} label="Govt ID Number" value={combineAddress({ govtIdNum: (patient as any).govt_id_number || (patient as any).government_id })} />
            </View>
          </View>

          {/* Videos Section */}
          {hasVideos && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{videoSection.sectionName || 'Videos'}</Text>
              {videoSection.sectionSubTitle && (
                <Text style={styles.sectionSubTitle}>{videoSection.sectionSubTitle}</Text>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videosContainer}
                decelerationRate="fast"
                snapToInterval={VIDEO_CARD_WIDTH + VIDEO_CARD_SPACING}
                snapToAlignment="start"
              >
                {videos.map((video: { title: string; url: string }, idx: number) => (
                  <VideoCard key={idx} video={video} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Premium Video Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="fade"
        transparent={true}
        onRequestClose={closeVideo}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={styles.modalGradient}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.95)']}
                style={styles.modalContentGradient}
              >
                <TouchableOpacity onPress={closeVideo} style={styles.modalCloseButton}>
                  <LinearGradient
                    colors={['rgba(32,32,107,0.9)', 'rgba(32,32,107,0.7)']}
                    style={styles.closeButtonGradient}
                  >
                    <X size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.playerWrapper}>
                  {selectedVideo && (
                    <YoutubePlayer
                      ref={playerRef}
                      height={SCREEN_WIDTH * 0.56} // 16:9 ratio
                      width="100%"
                      play={isPlaying}
                      videoId={getVideoId(selectedVideo.url)}
                      onChangeState={(state: string) => {
                        if (state === 'ended') {
                          setIsPlaying(false);
                        }
                      }}
                      initialPlayerParams={{
                        controls: true,
                        rel: false,
                        showinfo: false,
                        modestbranding: true,
                        fs: false,
                        cc_load_policy: false,
                        iv_load_policy: 3,
                        disablekb: true,
                      }}
                      webViewStyle={{ opacity: 0.99 }}
                    />
                  )}
                </View>

                <View style={styles.modalTitleContainer}>
                  <LinearGradient
                    colors={['rgba(32,32,107,0.05)', 'rgba(32,32,107,0.02)']}
                    style={styles.titleGradient}
                  >
                    <Text style={styles.modalVideoTitle} numberOfLines={3}>
                      {selectedVideo?.title || 'Video'}
                    </Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  headerBackground: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerContent: { paddingTop: SPACING.md },
  logoSmallContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: SPACING.sm,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  logoSmall: { width: 130, height: 40 },
  welcomeSection: { marginTop: SPACING.sm },
  welcomeText: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  patientName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dfedf6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: '#20206b',
  },
  patientId: { fontSize: FONT_SIZES.sm, color: '#20206b', fontWeight: '700' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  quickStatsSection: { marginTop: SPACING.md, marginBottom: SPACING.lg },
  quickStatsGrid: { flexDirection: 'row', gap: SPACING.md },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickStatValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: '#20206b',
    marginBottom: 2,
  },
  quickStatLabel: { fontSize: FONT_SIZES.xs, color: '#262f82', textAlign: 'center' },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#20206b',
    marginBottom: SPACING.sm,
  },
  sectionSubTitle: {
    fontSize: FONT_SIZES.md,
    color: '#475569',
    marginBottom: SPACING.md,
  },
  cardsContainer: { gap: SPACING.sm },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dfedf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.xs, color: '#262f82', marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: FONT_SIZES.md, color: '#20206b', fontWeight: '600' },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },

  // Video section styles
  videosContainer: {
    paddingHorizontal: SPACING.md,
  },
  videoCard: {
    width: VIDEO_CARD_WIDTH,
    marginRight: VIDEO_CARD_SPACING,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#20206b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  videoCardGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  thumbnailContainer: {
    height: VIDEO_CARD_WIDTH * 0.5625,
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoTextContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  videoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 22,
    letterSpacing: -0.3,
  },

  // Premium Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 30,
  },
  modalContentGradient: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalTitleContainer: {
    overflow: 'hidden',
  },
  titleGradient: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  modalVideoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#20206b',
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
});