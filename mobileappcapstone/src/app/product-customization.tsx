import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const flavorOptions = [
  'Vanilla',
  'Chocolate',
  'Strawberry',
  'Caramel',
  'Mocha',
  'Hazelnut',
  'Original',
  'Matcha',
  'Coconut',
];

const sizeOptions = [
  '100g',
  '250g',
  '500g',
  '1kg',
  '2kg',
  '5kg',
];

const packagingOptions = [
  'Pouch',
  'Box',
  'Can',
  'Bottle',
  'Jar',
  'Sachet',
  'Tin',
  'Bag',
];

const containerOptions = [
  'Plastic',
  'Glass',
  'Metal',
  'Paper',
  'Aluminum',
  'Biodegradable',
];

const quantityOptions = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '1000',
  '2000',
  '5000',
  '10000',
];

export default function ProductCustomizationScreen() {
  const { colors } = useTheme();
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
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState<'flavor' | 'size' | 'packaging' | 'container' | 'quantity' | null>(null);

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

  const openSelector = (type: 'flavor' | 'size' | 'packaging' | 'container' | 'quantity') => {
    setActiveSelector(type);
    setModalVisible(true);
  };

  const selectOption = (option: string) => {
    if (activeSelector === 'flavor') {
      setFormData({ ...formData, flavor: option });
    } else if (activeSelector === 'size') {
      setFormData({ ...formData, size: option });
    } else if (activeSelector === 'packaging') {
      setFormData({ ...formData, packaging: option });
    } else if (activeSelector === 'container') {
      setFormData({ ...formData, container: option });
    } else if (activeSelector === 'quantity') {
      setFormData({ ...formData, quantity: option });
    }
    setModalVisible(false);
    setActiveSelector(null);
  };

  const getOptions = () => {
    switch (activeSelector) {
      case 'flavor':
        return flavorOptions;
      case 'size':
        return sizeOptions;
      case 'packaging':
        return packagingOptions;
      case 'container':
        return containerOptions;
      case 'quantity':
        return quantityOptions;
      default:
        return [];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Product Customization</Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Rebranding & Private Labeling</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Product Type</Text>
            <View style={[styles.readOnlyField, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.readOnlyText, { color: colors.text }]}>{formData.productType}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Flavor *</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => openSelector('flavor')}
            >
              <Text style={[styles.selectorButtonText, { color: formData.flavor ? colors.text : '#666' }]}>
                {formData.flavor || 'Select flavor'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Size *</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => openSelector('size')}
            >
              <Text style={[styles.selectorButtonText, { color: formData.size ? colors.text : '#666' }]}>
                {formData.size || 'Select size'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Packaging</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => openSelector('packaging')}
            >
              <Text style={[styles.selectorButtonText, { color: formData.packaging ? colors.text : '#666' }]}>
                {formData.packaging || 'Select packaging'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Container</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => openSelector('container')}
            >
              <Text style={[styles.selectorButtonText, { color: formData.container ? colors.text : '#666' }]}>
                {formData.container || 'Select container'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Label Design Idea</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={formData.labelDesign}
              onChangeText={(text) => setFormData({ ...formData, labelDesign: text })}
              placeholder="Describe your label design idea"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Brand Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={formData.brandName}
              onChangeText={(text) => setFormData({ ...formData, brandName: text })}
              placeholder="Enter your brand name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
            <Text style={[styles.moqText, { color: colors.textSecondary }]}>MOQ: 100 units</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => openSelector('quantity')}
            >
              <Text style={[styles.selectorButtonText, { color: formData.quantity ? colors.text : '#666' }]}>
                {formData.quantity ? formData.quantity + ' units' : 'Select quantity'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Upload Logo/Label Design</Text>
            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.border, borderColor: colors.accent }]} onPress={pickImage}>
              <Text style={[styles.uploadButtonText, { color: colors.accent }]}>
                {uploadedImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
            {uploadedImage && (
              <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {activeSelector === 'flavor' ? 'Select Flavor' : activeSelector === 'size' ? 'Select Size' : activeSelector === 'packaging' ? 'Select Packaging' : activeSelector === 'container' ? 'Select Container' : 'Select Quantity'}
            </Text>
            <ScrollView style={styles.optionsList}>
              {getOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionItem, { borderBottomColor: colors.border }]}
                  onPress={() => selectOption(option)}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.border }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  formSection: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  moqText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  readOnlyField: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: 15,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  selectorButtonText: {
    fontSize: 15,
    flex: 1,
  },
  selectorArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  uploadButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCloseButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
