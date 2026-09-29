import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { getVerificationStatus, submitVerification } from '../services/api';

type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

interface StatusInfo {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
  description: string;
}

const STATUS_CONFIG: Record<VerificationStatus, StatusInfo> = {
  not_submitted: {
    icon: 'shield-outline',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Not Verified',
    description: 'Upload your business permit to unlock the ability to submit inquiries and place orders.',
  },
  pending: {
    icon: 'time-outline',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    label: 'Under Review',
    description: 'Your business permit has been submitted. Our team will review it and notify you within 1–2 business days.',
  },
  approved: {
    icon: 'shield-checkmark',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Verified',
    description: 'Your account is fully verified. You can now submit inquiries and place orders.',
  },
  rejected: {
    icon: 'shield-half-outline',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    label: 'Rejected',
    description: 'Your verification was not approved. Please review the reason below and re-upload a valid document.',
  },
};

export default function VerificationScreen() {
  const { colors } = useTheme();

  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [regNumber, setRegNumber]           = useState<string | null>(null);
  const [status, setStatus]                 = useState<VerificationStatus>('not_submitted');
  const [permitUrl, setPermitUrl]           = useState<string | null>(null);
  const [submittedAt, setSubmittedAt]       = useState<string | null>(null);
  const [reviewedAt, setReviewedAt]         = useState<string | null>(null);
  const [notes, setNotes]                   = useState<string | null>(null);
  const [selectedFile, setSelectedFile]     = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getVerificationStatus();
      setRegNumber(data.registration_number);
      setStatus(data.verification_status);
      setPermitUrl(data.business_permit_url);
      setSubmittedAt(data.verification_submitted_at);
      setReviewedAt(data.verification_reviewed_at);
      setNotes(data.verification_notes);
    } catch {
      // silently keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const pickDocument = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to upload a document.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedFile(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select your business permit image first.');
      return;
    }

    setSubmitting(true);
    try {
      await submitVerification(selectedFile);
      setSelectedFile(null);
      await fetchStatus();
      Alert.alert(
        'Submitted! 🎉',
        'Your business permit has been submitted for review. We will notify you once it has been approved.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Submission failed', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = STATUS_CONFIG[status];
  const canSubmit = status === 'not_submitted' || status === 'rejected';

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Registration Number Card */}
        {regNumber && (
          <View style={[styles.regCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="id-card-outline" size={20} color="#2196F3" />
            <View style={styles.regInfo}>
              <Text style={[styles.regLabel, { color: colors.textSecondary }]}>Registration Number</Text>
              <Text style={[styles.regNumber, { color: colors.text }]}>{regNumber}</Text>
            </View>
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: cfg.color + '25' }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color} />
          </View>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>{cfg.description}</Text>
        </View>

        {/* Timeline */}
        {(submittedAt || reviewedAt) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text>
            {submittedAt && (
              <View style={styles.timelineRow}>
                <Ionicons name="arrow-up-circle-outline" size={16} color="#2196F3" />
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
                  Submitted: {formatDate(submittedAt)}
                </Text>
              </View>
            )}
            {reviewedAt && (
              <View style={styles.timelineRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={cfg.color} />
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
                  Reviewed: {formatDate(reviewedAt)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Rejection Notes */}
        {status === 'rejected' && notes && (
          <View style={[styles.section, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#ef444440' }]}>
            <View style={styles.notesHeader}>
              <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 0, marginLeft: 8 }]}>
                Rejection Reason
              </Text>
            </View>
            <Text style={[styles.notesText, { color: colors.text }]}>{notes}</Text>
          </View>
        )}

        {/* Existing Permit Preview */}
        {permitUrl && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Submitted Document</Text>
            <Image source={{ uri: permitUrl }} style={styles.permitPreview} resizeMode="cover" />
          </View>
        )}

        {/* Upload Section (only for not_submitted / rejected) */}
        {canSubmit && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Business Permit</Text>
            <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
              Upload a clear photo of your DTI/SEC/Mayor's Permit or any valid business registration document.
            </Text>

            <TouchableOpacity
              style={[styles.pickBtn, { borderColor: '#2196F3' }]}
              onPress={pickDocument}
              activeOpacity={0.75}
            >
              {selectedFile ? (
                <Image source={{ uri: selectedFile }} style={styles.previewThumb} resizeMode="cover" />
              ) : (
                <View style={styles.pickPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#2196F3" />
                  <Text style={[styles.pickText, { color: '#2196F3' }]}>Tap to select a photo</Text>
                  <Text style={[styles.pickSub, { color: colors.textSecondary }]}>JPG, PNG — max 10 MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedFile && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={styles.clearText}>Remove selection</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: selectedFile ? '#2196F3' : '#2196F360' },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !selectedFile}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={styles.submitInner}>
                    <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>
                      {status === 'rejected' ? 'Re-submit for Review' : 'Submit for Verification'}
                    </Text>
                  </View>
                )
              }
            </TouchableOpacity>
          </View>
        )}

        {/* What happens next */}
        {status !== 'approved' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What happens next?</Text>
            {[
              { icon: 'document-text-outline', text: 'Upload your business permit above.' },
              { icon: 'search-outline', text: 'Our team reviews your document (1–2 business days).' },
              { icon: 'notifications-outline', text: 'You receive a notification once approved or rejected.' },
              { icon: 'checkmark-circle-outline', text: 'Once approved, you can submit inquiries.' },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: '#2196F320' }]}>
                  <Text style={[styles.stepNumText, { color: '#2196F3' }]}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon as any} size={16} color="#2196F3" style={{ marginHorizontal: 10 }} />
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 40 },

  regCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  regInfo: { flex: 1 },
  regLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  regNumber: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  statusCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 24,
    marginBottom: 14,
  },
  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusLabel: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  statusDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timelineText: { fontSize: 13 },

  notesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 20 },

  permitPreview: { width: '100%', height: 180, borderRadius: 10 },

  uploadHint: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  pickBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  pickPlaceholder: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pickText: { fontSize: 15, fontWeight: '600' },
  pickSub: { fontSize: 12 },
  previewThumb: { width: '100%', height: 180 },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    alignSelf: 'flex-end',
  },
  clearText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },

  submitBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitInner: { flexDirection: 'row', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
