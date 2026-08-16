import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProductCustomizationScreen() {
  const { name } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    productType: name?.toString() || '',
    flavor: '',
    size: '',
    packaging: '',
    container: '',
    labelDesign: '',
    brandName: '',
    quantity: '',
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an image');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    console.log('handleSubmit called');
    console.log('Form data:', formData);
    
    if (!formData.flavor || !formData.size || !formData.quantity) {
      Alert.alert('Missing Information', 'Please fill in the required fields');
      return;
    }
    
    console.log('Navigating to payment-method with form data');
    router.push({
      pathname: '/payment-method',
      params: { 
        formData: JSON.stringify(formData),
        imageData: uploadedImage || ''
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Customization</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Product Rebranding & Private Labeling</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Type</Text>
            <TextInput
              style={styles.input}
              value={formData.productType}
              onChangeText={(text) => setFormData({ ...formData, productType: text })}
              placeholder="Enter product type"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Flavor *</Text>
            <TextInput
              style={styles.input}
              value={formData.flavor}
              onChangeText={(text) => setFormData({ ...formData, flavor: text })}
              placeholder="Enter desired flavor"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Size *</Text>
            <TextInput
              style={styles.input}
              value={formData.size}
              onChangeText={(text) => setFormData({ ...formData, size: text })}
              placeholder="Enter size (e.g., 500g, 1kg)"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Packaging</Text>
            <TextInput
              style={styles.input}
              value={formData.packaging}
              onChangeText={(text) => setFormData({ ...formData, packaging: text })}
              placeholder="Enter packaging type"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Container</Text>
            <TextInput
              style={styles.input}
              value={formData.container}
              onChangeText={(text) => setFormData({ ...formData, container: text })}
              placeholder="Enter container type"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Label Design Idea</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.labelDesign}
              onChangeText={(text) => setFormData({ ...formData, labelDesign: text })}
              placeholder="Describe your label design idea"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Brand Name</Text>
            <TextInput
              style={styles.input}
              value={formData.brandName}
              onChangeText={(text) => setFormData({ ...formData, brandName: text })}
              placeholder="Enter your brand name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="Enter desired quantity"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Upload Logo/Label Design</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>
                {uploadedImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
            {uploadedImage && (
              <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Inquiry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  formSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#2a2a40',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  uploadButtonText: {
    color: '#ff6b35',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
