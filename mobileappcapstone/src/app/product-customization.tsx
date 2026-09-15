import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getMe, submitInquiry, getCustomizationMaterials } from '../services/api';

interface CustomizationOptionItem {
  name: string;
  inStock: boolean;
  stockQuantity?: number;
}

const defaultFlavors: CustomizationOptionItem[] = [
  { name: 'Vanilla', inStock: true, stockQuantity: 150 },
  { name: 'Chocolate', inStock: true, stockQuantity: 200 },
  { name: 'Strawberry', inStock: true, stockQuantity: 85 },
  { name: 'Caramel', inStock: true, stockQuantity: 120 },
  { name: 'Mocha', inStock: true, stockQuantity: 90 },
  { name: 'Hazelnut', inStock: false, stockQuantity: 0 },
  { name: 'Original', inStock: true, stockQuantity: 300 },
  { name: 'Matcha', inStock: true, stockQuantity: 45 },
  { name: 'Coconut', inStock: false, stockQuantity: 0 },
];

const sizeOptions: CustomizationOptionItem[] = [
  { name: '100g', inStock: true },
  { name: '250g', inStock: true },
  { name: '500g', inStock: true },
  { name: '1kg', inStock: true },
  { name: '2kg', inStock: true },
  { name: '5kg', inStock: true },
];

const defaultPackaging: CustomizationOptionItem[] = [
  { name: 'Pouch', inStock: true, stockQuantity: 500 },
  { name: 'Box', inStock: true, stockQuantity: 350 },
  { name: 'Can', inStock: true, stockQuantity: 200 },
  { name: 'Bottle', inStock: true, stockQuantity: 400 },
  { name: 'Jar', inStock: true, stockQuantity: 150 },
  { name: 'Sachet', inStock: true, stockQuantity: 600 },
  { name: 'Tin', inStock: false, stockQuantity: 0 },
  { name: 'Bag', inStock: true, stockQuantity: 250 },
];

const defaultContainers: CustomizationOptionItem[] = [
  { name: 'Plastic', inStock: true, stockQuantity: 500 },
  { name: 'Glass', inStock: true, stockQuantity: 200 },
  { name: 'Metal', inStock: true, stockQuantity: 150 },
  { name: 'Paper', inStock: true, stockQuantity: 300 },
  { name: 'Aluminum', inStock: true, stockQuantity: 180 },
  { name: 'Biodegradable', inStock: false, stockQuantity: 0 },
];

const quantityOptions: CustomizationOptionItem[] = [
  { name: '100', inStock: true },
  { name: '200', inStock: true },
  { name: '300', inStock: true },
  { name: '400', inStock: true },
  { name: '500', inStock: true },
  { name: '1000', inStock: true },
  { name: '2000', inStock: true },
  { name: '5000', inStock: true },
  { name: '10000', inStock: true },
];

export default function ProductCustomizationScreen() {
  const { colors, isDarkMode } = useTheme();
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState<'flavor' | 'size' | 'packaging' | 'container' | 'quantity' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Dynamic raw material inventory state
  const [flavorOptions, setFlavorOptions] = useState<CustomizationOptionItem[]>(defaultFlavors);
  const [packagingOptions, setPackagingOptions] = useState<CustomizationOptionItem[]>(defaultPackaging);
  const [containerOptions, setContainerOptions] = useState<CustomizationOptionItem[]>(defaultContainers);

  // Load real-time raw material inventory on mount
  useEffect(() => {
    async function loadMaterials() {
      try {
        setLoadingMaterials(true);
        const res = await getCustomizationMaterials();

        if (res && res.flavors && res.flavors.length > 0) {
          setFlavorOptions(
            res.flavors.map((f: any) => ({
              name: f.name,
              inStock: Boolean(f.in_stock && Number(f.stock_quantity) > 0),
              stockQuantity: Number(f.stock_quantity) || 0,
            }))
          );
        }

        if (res && res.packaging && res.packaging.length > 0) {
          setPackagingOptions(
            res.packaging.map((p: any) => ({
              name: p.name,
              inStock: Boolean(p.in_stock && Number(p.stock_quantity) > 0),
              stockQuantity: Number(p.stock_quantity) || 0,
            }))
          );
        }

        if (res && res.containers && res.containers.length > 0) {
          setContainerOptions(
            res.containers.map((c: any) => ({
              name: c.name,
              inStock: Boolean(c.in_stock && Number(c.stock_quantity) > 0),
              stockQuantity: Number(c.stock_quantity) || 0,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load dynamic raw materials stock, using defaults:', err);
      } finally {
        setLoadingMaterials(false);
      }
    }

    loadMaterials();
  }, []);

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

  const handleSubmit = async () => {
    if (!formData.flavor || !formData.size || !formData.quantity) {
      Alert.alert('Missing Information', 'Please fill in Flavor, Size, and Quantity before submitting.');
      return;
    }

    // Check if selected flavor or packaging is out of stock
    const selectedFlavorObj = flavorOptions.find((f) => f.name.toLowerCase() === formData.flavor.toLowerCase());
    if (selectedFlavorObj && !selectedFlavorObj.inStock) {
      Alert.alert('Out of Stock', `The selected flavor "${formData.flavor}" is currently out of stock. Please select another flavor.`);
      return;
    }

    const selectedPackagingObj = packagingOptions.find((p) => p.name.toLowerCase() === formData.packaging.toLowerCase());
    if (selectedPackagingObj && !selectedPackagingObj.inStock) {
      Alert.alert('Out of Stock', `The selected packaging "${formData.packaging}" is currently out of stock. Please select another packaging type.`);
      return;
    }

    const selectedContainerObj = containerOptions.find((c) => c.name.toLowerCase() === formData.container.toLowerCase());
    if (selectedContainerObj && !selectedContainerObj.inStock) {
      Alert.alert('Out of Stock', `The selected container "${formData.container}" is currently out of stock. Please select another container.`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get the logged-in user's businessClient profile to get client_id.
      const me = await getMe();
      const clientId = me?.business_client?.client_id ?? me?.businessClient?.client_id;

      if (!clientId) {
        Alert.alert('Error', 'Could not find your business client profile. Please contact support.');
        return;
      }

      // 2. Map the form fields to the backend's customization schema.
      const customizations = [{
        packaging_type: formData.packaging || formData.productType,
        packaging_finish: formData.container || undefined,
        serving_size: `${formData.size} × ${formData.quantity} units`,
        client_notes: [
          formData.flavor ? `Flavor: ${formData.flavor}` : null,
          formData.brandName ? `Brand: ${formData.brandName}` : null,
          formData.labelDesign ? `Label: ${formData.labelDesign}` : null,
        ].filter(Boolean).join(' | ') || undefined,
      }];

      // 3. Submit to the backend.
      await submitInquiry(clientId, customizations);

      setSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSelector = (type: 'flavor' | 'size' | 'packaging' | 'container' | 'quantity') => {
    setActiveSelector(type);
    setModalVisible(true);
  };

  const selectOption = (option: CustomizationOptionItem) => {
    if (!option.inStock) {
      return; // Do nothing if out of stock
    }

    if (activeSelector === 'flavor') {
      setFormData({ ...formData, flavor: option.name });
    } else if (activeSelector === 'size') {
      setFormData({ ...formData, size: option.name });
    } else if (activeSelector === 'packaging') {
      setFormData({ ...formData, packaging: option.name });
    } else if (activeSelector === 'container') {
      setFormData({ ...formData, container: option.name });
    } else if (activeSelector === 'quantity') {
      setFormData({ ...formData, quantity: option.name });
    }
    setModalVisible(false);
    setActiveSelector(null);
  };

  const getOptions = (): CustomizationOptionItem[] => {
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

          {/* Flavor Selector */}
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

          {/* Size Selector */}
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

          {/* Packaging Selector */}
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

          {/* Container Selector */}
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
              <Text style={[styles.selectorButtonText, { color: formData.quantity ? formData.quantity + ' units' : 'Select quantity' }]}>
                {formData.quantity ? formData.quantity + ' units' : 'Select quantity'}
              </Text>
              <Text style={[styles.selectorArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Upload Logo/Label Design</Text>
            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.border, borderColor: '#2196F3' }]} onPress={pickImage}>
              <Text style={[styles.uploadButtonText, { color: '#2196F3' }]}>
                {uploadedImage ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
            {uploadedImage && (
              <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Proceed</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Selection Modal with Disabled Out-of-Stock Items ───────────── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {activeSelector === 'flavor'
                ? 'Select Flavor'
                : activeSelector === 'size'
                  ? 'Select Size'
                  : activeSelector === 'packaging'
                    ? 'Select Packaging'
                    : activeSelector === 'container'
                      ? 'Select Container'
                      : 'Select Quantity'}
            </Text>

            <ScrollView style={styles.optionsList}>
              {getOptions().map((option, index) => {
                const isOutOfStock = !option.inStock;

                return (
                  <TouchableOpacity
                    key={index}
                    disabled={isOutOfStock}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                      isOutOfStock && [
                        styles.optionItemDisabled,
                        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                      ],
                    ]}
                    onPress={() => selectOption(option)}
                    activeOpacity={isOutOfStock ? 1 : 0.6}
                  >
                    <View style={styles.optionRow}>
                      <Text
                        style={[
                          styles.optionText,
                          { color: isOutOfStock ? '#9ca3af' : colors.text },
                          isOutOfStock && styles.optionTextDisabled,
                        ]}
                      >
                        {option.name}
                      </Text>

                      {isOutOfStock && (
                        <View style={[styles.outOfStockBadge, isDarkMode && styles.outOfStockBadgeDark]}>
                          <Text style={[styles.outOfStockBadgeText, isDarkMode && styles.outOfStockBadgeTextDark]}>
                            Out of Stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
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

      {/* ── SweetAlert Success Modal Matching Mobile App Theme ── */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          router.push('/home');
        }}
      >
        <View style={styles.sweetAlertOverlay}>
          <View style={[styles.sweetAlertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top Checkmark Badge with Radiating Sparks */}
            <View style={styles.sweetAlertIconContainer}>
              <View style={[styles.sparkLine, styles.sparkTopLeft, { backgroundColor: '#2196F3' }]} />
              <View style={[styles.sparkLine, styles.sparkLeft, { backgroundColor: '#2196F3' }]} />
              <View style={[styles.sparkLine, styles.sparkBottomLeft, { backgroundColor: '#2196F3' }]} />
              <View style={[styles.sparkLine, styles.sparkTopRight, { backgroundColor: '#2196F3' }]} />
              <View style={[styles.sparkLine, styles.sparkRight, { backgroundColor: '#2196F3' }]} />
              <View style={[styles.sparkLine, styles.sparkBottomRight, { backgroundColor: '#2196F3' }]} />

              <View
                style={[
                  styles.sweetAlertOuterCircle,
                  {
                    backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd',
                    borderColor: isDarkMode ? 'rgba(33, 150, 243, 0.3)' : '#bbdefb',
                  },
                ]}
              >
                <View style={[styles.sweetAlertInnerCircle, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="checkmark" size={38} color="#ffffff" style={{ fontWeight: 'bold' }} />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.sweetAlertTitle, { color: colors.text }]}>Inquiry Submitted!</Text>

            {/* Description */}
            <Text style={[styles.sweetAlertDesc, { color: colors.textSecondary }]}>
              Your rebranding inquiry has been sent to our sales team. We will review your requirements and get back to you with a quotation.
            </Text>

            {/* OK Button */}
            <TouchableOpacity
              style={[styles.sweetAlertButton, { backgroundColor: '#2196F3', shadowColor: '#2196F3' }]}
              onPress={() => {
                setSuccessModalVisible(false);
                router.push('/home');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.sweetAlertButtonText}>OK</Text>
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
    backgroundColor: '#2196F3',
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
    backgroundColor: '#2196F3',
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    maxHeight: 340,
    marginBottom: 16,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  optionItemDisabled: {
    opacity: 0.55,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextDisabled: {
    color: '#9ca3af',
  },
  outOfStockBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  outOfStockBadgeDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  outOfStockBadgeText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  outOfStockBadgeTextDark: {
    color: '#f87171',
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

  /* ── SweetAlert Reference Image Styles ── */
  /* ── SweetAlert Dynamic Theme Styles ── */
  sweetAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sweetAlertCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  sweetAlertIconContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sweetAlertOuterCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweetAlertInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkLine: {
    position: 'absolute',
    borderRadius: 3,
  },
  sparkTopLeft: {
    width: 4,
    height: 10,
    top: 6,
    left: 10,
    transform: [{ rotate: '-45deg' }],
  },
  sparkLeft: {
    width: 10,
    height: 4,
    top: 46,
    left: 0,
  },
  sparkBottomLeft: {
    width: 4,
    height: 10,
    bottom: 6,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
  sparkTopRight: {
    width: 4,
    height: 10,
    top: 6,
    right: 10,
    transform: [{ rotate: '45deg' }],
  },
  sparkRight: {
    width: 10,
    height: 4,
    top: 46,
    right: 0,
  },
  sparkBottomRight: {
    width: 4,
    height: 10,
    bottom: 6,
    right: 10,
    transform: [{ rotate: '-45deg' }],
  },
  sweetAlertTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  sweetAlertDesc: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  sweetAlertButton: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 48,
    minWidth: 130,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  sweetAlertButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
