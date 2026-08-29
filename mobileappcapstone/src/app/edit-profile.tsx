import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { getMe, resolveImageUrl, updateMyProfile, uploadMyProfilePicture } from '../services/api';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) return;
        const businessClient = user?.business_client ?? user?.businessClient;
        setName(user?.full_name ?? '');
        setEmail(user?.email ?? '');
        setPhone(user?.phone_number ?? '');
        setAddress(businessClient?.business_address ?? '');
        setProfilePicture(resolveImageUrl(businessClient?.profile_pic_url ?? businessClient?.profile_pic));
      })
      .catch(() => {
        // Leave fields blank rather than showing another person's placeholder data.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploadingPicture(true);
      const response = await uploadMyProfilePicture(result.assets[0].uri);
      setProfilePicture(resolveImageUrl(response.profile_pic_url));
      Alert.alert('Profile picture updated', 'Your new picture is now visible in your chats.');
    } catch (error: any) {
      Alert.alert('Could not update profile picture', error?.message ?? 'Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Full name required', 'Enter your full name before saving.');
      return;
    }

    try {
      setSaving(true);
      await updateMyProfile({
        full_name: name.trim(),
        phone_number: phone.trim() || null,
        business_address: address.trim() || null,
      });
      Alert.alert('Profile saved', 'Your profile details have been updated.');
      router.replace('/profile');
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.pictureSection}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={[styles.profilePicture, { backgroundColor: '#2196F3' }]}>
                <Text style={styles.profilePictureFallback}>{name.trim().slice(0, 2).toUpperCase() || 'B'}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.pictureButton, { opacity: uploadingPicture ? 0.65 : 1 }]}
              onPress={handlePickProfilePicture}
              disabled={uploadingPicture}
            >
              {uploadingPicture ? <ActivityIndicator color="#2196F3" /> : <Text style={styles.pictureButtonText}>Change photo</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.readOnlyField, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.readOnlyText, { color: colors.text }]}>{email}</Text>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor="#666"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#2196F3', opacity: saving ? 0.65 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
  pictureSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureFallback: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  pictureButton: {
    marginTop: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  pictureButtonText: {
    color: '#2196F3',
    fontWeight: '700',
    fontSize: 15,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  readOnlyField: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
