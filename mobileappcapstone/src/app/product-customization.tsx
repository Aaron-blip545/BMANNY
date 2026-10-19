import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  getMe,
  getProducts,
  getCustomizationMaterials,
  submitInquiry,
} from '../services/api';

interface RawMaterialItem {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  rate?: number;
  unit_of_measure?: string;
  stock_quantity: number;
  in_stock: boolean;
}

interface FormulationRow {
  product_id: number;
  raw_material_name: string;
  raw_material_sku: string;
  unit_of_measure: string;
  quantity_per_unit: string;
  rate: number;
  amount: number;
}

interface PackagingTypeOption {
  id: string | number;
  name: string;
  category?: string;
  inStock: boolean;
  stockQuantity?: number;
}

const defaultPackagingTypes: PackagingTypeOption[] = [
  { id: 'pouch', name: 'Stand-up Pouch', category: 'Pouch', inStock: true, stockQuantity: 500 },
  { id: 'sachet', name: 'Stick / Sachet', category: 'Sachet', inStock: true, stockQuantity: 600 },
  { id: 'bottle', name: 'HDPE / PET Bottle', category: 'Bottle', inStock: true, stockQuantity: 400 },
  { id: 'jar', name: 'Glass / Plastic Jar', category: 'Jar', inStock: true, stockQuantity: 150 },
  { id: 'box', name: 'Master Packaging Box', category: 'Box', inStock: true, stockQuantity: 350 },
  { id: 'can', name: 'Composite Can / Tin', category: 'Can', inStock: true, stockQuantity: 200 },
];

export default function ProductCustomizationScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    product_code?: string;
    category?: string;
    price?: string;
    moq?: string;
    description?: string;
    image?: string;
  }>();

  const scrollViewRef = useRef<ScrollView>(null);

  // ── Step Navigation State: 1 = Ingredients | 2 = Packaging & Company Info | 3 = Details & Submit ──
  // (No top stepper tabs bar — clean page-to-page navigation with Proceed/Back buttons)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ── Product Catalog & Materials State ──
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productCode, setProductCode] = useState(params.product_code || 'FP-0001');
  const [productName, setProductName] = useState(params.name || 'Corn Coffee');
  const [productMoq, setProductMoq] = useState(params.moq || '100 units');
  const [productCategory, setProductCategory] = useState(params.category || 'Health & Wellness');
  const [catalogPrice, setCatalogPrice] = useState<number>(0);
  const [catalogRawMaterials, setCatalogRawMaterials] = useState<RawMaterialItem[]>([]);

  // ── Company Info (Pre-filled from authenticated client, editable in Step 2) ──
  const [companyName, setCompanyName] = useState('BManny Client');
  const [contactPerson, setContactPerson] = useState('Client Representative');
  const [todayDate] = useState(
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );

  // ── Step 1: Formulation Recipe Rows ──
  const [formulationRows, setFormulationRows] = useState<FormulationRow[]>([]);
  const [rawMaterialPickerIndex, setRawMaterialPickerIndex] = useState<number | null>(null);
  const [rawMaterialModalVisible, setRawMaterialModalVisible] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  // ── Step 2: Packaging & Branding ──
  const [packagingOptionsList, setPackagingOptionsList] = useState<PackagingTypeOption[]>(defaultPackagingTypes);
  const [selectedPackaging, setSelectedPackaging] = useState('Pouch');
  const [selectedFinish, setSelectedFinish] = useState('STICKER LABEL');
  const [packagingDimensions, setPackagingDimensions] = useState('12X20cm');
  const [brandName, setBrandName] = useState('YOUR BRAND');
  const [servingSize, setServingSize] = useState('120g');
  const [quantity, setQuantity] = useState('100');
  const [uploadedLogoUri, setUploadedLogoUri] = useState<string | null>(null);
  const [clientNotes, setClientNotes] = useState('');

  // ── SweetAlert Success Modal ──
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdInquiryId, setCreatedInquiryId] = useState<number | null>(null);

  // ── Load Catalog & Materials on Mount ──
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [materialsRes, productsRes, meRes] = await Promise.all([
          getCustomizationMaterials().catch(() => null),
          getProducts().catch(() => null),
          getMe().catch(() => null),
        ]);

        if (meRes) {
          const biz = meRes.business_client || meRes.businessClient;
          const comp = biz?.business_name || meRes.full_name || 'BManny Client';
          const contact = biz?.contact_person || meRes.full_name || 'Client';
          setCompanyName(comp);
          setContactPerson(contact);
        }

        let materials: RawMaterialItem[] = [];
        if (materialsRes) {
          const list = materialsRes.raw_materials || materialsRes.all || [];
          materials = list.map((m: any) => ({
            product_id: m.product_id,
            name: m.name,
            sku: m.sku,
            category: m.category || 'Raw Materials',
            price: Number(m.rate || m.price || 0),
            rate: Number(m.rate || m.price || 0),
            unit_of_measure: m.unit_of_measure || 'kg',
            stock_quantity: Number(m.stock_quantity || 0),
            in_stock: Boolean(m.in_stock && Number(m.stock_quantity) > 0),
          }));
          setCatalogRawMaterials(materials);

          if (materialsRes.packaging_options && materialsRes.packaging_options.length > 0) {
            setPackagingOptionsList(
              materialsRes.packaging_options.map((p) => ({
                id: p.packaging_id,
                name: p.name,
                category: p.category,
                inStock: p.is_available,
              }))
            );
          }
        }

        // Match current product to populate existing recipe / BOM
        if (Array.isArray(productsRes)) {
          const targetName = (params.name || '').toLowerCase().trim();
          const targetId = Number(params.id);
          const matched = productsRes.find(
            (p: any) =>
              (targetId && (p.id === targetId || p.product_type_id === targetId)) ||
              (targetName && p.name && p.name.toLowerCase().trim() === targetName)
          );

          if (matched) {
            setProductName(matched.name);
            if (matched.product_code) setProductCode(matched.product_code);
            if (matched.moq) setProductMoq(matched.moq);
            if (matched.category) setProductCategory(matched.category);
            if (matched.base_price) setCatalogPrice(Number(matched.base_price));
            else if (matched.price) {
              const num = parseFloat(String(matched.price).replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) setCatalogPrice(num);
            }
            if (matched.net_weight) setServingSize(matched.net_weight);
            if (matched.packaging_specification) setPackagingDimensions(matched.packaging_specification);

            if (matched.recipes && matched.recipes.length > 0) {
              const rows: FormulationRow[] = matched.recipes.map((r: any) => {
                const qty = Number(r.quantity_per_unit || 0);
                const rate = Number(r.rate || 0);
                return {
                  product_id: r.product_id,
                  raw_material_name: r.raw_material_name || r.name || 'Raw Material',
                  raw_material_sku: r.raw_material_sku || r.sku || '',
                  unit_of_measure: r.unit_of_measure || 'kg',
                  quantity_per_unit: String(r.quantity_per_unit || '0.001'),
                  rate: rate,
                  amount: Math.round(qty * rate * 100) / 100,
                };
              });
              setFormulationRows(rows);
              return;
            }
          }
        }

        // Fallback default formulation rows
        if (materials.length > 0) {
          const sample = materials.slice(0, 4).map((m, idx) => {
            const defaultQty = idx === 0 ? '0.0003' : idx === 1 ? '0.00434' : idx === 2 ? '0.00075' : '0.00808';
            const qtyNum = parseFloat(defaultQty) || 0;
            const rate = m.rate || m.price || 50;
            return {
              product_id: m.product_id,
              raw_material_name: m.name,
              raw_material_sku: m.sku,
              unit_of_measure: m.unit_of_measure || 'kg',
              quantity_per_unit: defaultQty,
              rate: rate,
              amount: Math.round(qtyNum * rate * 100) / 100,
            };
          });
          setFormulationRows(sample);
        }
      } catch (err) {
        console.warn('Error initializing customization data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, params.name]);

  // ── Calculation Formulas ──
  const calculatedFormulationCost = useMemo(() => {
    const total = formulationRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return Math.round(total * 100) / 100;
  }, [formulationRows]);

  const pricePerUnit = useMemo(() => {
    if (catalogPrice > 0) return catalogPrice;
    if (calculatedFormulationCost > 0) return Math.max(79.0, Math.round((calculatedFormulationCost + 20) * 100) / 100);
    return 79.0;
  }, [catalogPrice, calculatedFormulationCost]);

  const batchQtyNum = useMemo(() => {
    return parseInt(quantity, 10) || 100;
  }, [quantity]);

  const totalPrice = useMemo(() => {
    return Math.round(pricePerUnit * batchQtyNum * 100) / 100;
  }, [pricePerUnit, batchQtyNum]);

  // Formatted ingredients string for quotation table
  const ingredientsDisplayText = useMemo(() => {
    if (formulationRows.length === 0) {
      return `${productName.toUpperCase()} with NATURAL EXTRACTS`;
    }
    const names = formulationRows.map((r) => r.raw_material_name.toUpperCase()).slice(0, 3);
    return `${productName.toUpperCase()} with ${names.join(' & ')}`;
  }, [productName, formulationRows]);

  // ── Formulation Row Handlers ──
  const handleUpdateRowQuantity = (index: number, newQty: string) => {
    setFormulationRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row.quantity_per_unit = newQty;
      const numQty = parseFloat(newQty) || 0;
      row.amount = Math.round(numQty * row.rate * 100) / 100;
      updated[index] = row;
      return updated;
    });
  };

  const handleSelectRawMaterial = (material: RawMaterialItem) => {
    if (rawMaterialPickerIndex === null) return;
    setFormulationRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rawMaterialPickerIndex] };
      row.product_id = material.product_id;
      row.raw_material_name = material.name;
      row.raw_material_sku = material.sku;
      row.unit_of_measure = material.unit_of_measure || 'kg';
      row.rate = material.rate || material.price || 0;
      const numQty = parseFloat(row.quantity_per_unit) || 0;
      row.amount = Math.round(numQty * row.rate * 100) / 100;
      updated[rawMaterialPickerIndex] = row;
      return updated;
    });
    setRawMaterialModalVisible(false);
    setRawMaterialPickerIndex(null);
  };

  const handleAddRawMaterialRow = () => {
    const usedIds = new Set(formulationRows.map((r) => r.product_id));
    const nextAvail = catalogRawMaterials.find((m) => !usedIds.has(m.product_id)) || catalogRawMaterials[0];

    if (!nextAvail) {
      Alert.alert('Notice', 'No more raw materials available in catalog.');
      return;
    }

    const newRow: FormulationRow = {
      product_id: nextAvail.product_id,
      raw_material_name: nextAvail.name,
      raw_material_sku: nextAvail.sku,
      unit_of_measure: nextAvail.unit_of_measure || 'kg',
      quantity_per_unit: '0.001',
      rate: nextAvail.rate || nextAvail.price || 0,
      amount: Math.round(0.001 * (nextAvail.rate || nextAvail.price || 0) * 100) / 100,
    };

    setFormulationRows((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (formulationRows.length <= 1) {
      Alert.alert('Formulation Requirement', 'A composite formulation must have at least one ingredient.');
      return;
    }
    setFormulationRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow photo gallery access to upload your logo artwork.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setUploadedLogoUri(result.assets[0].uri);
    }
  };

  // ── Step Navigation Helpers ──
  const goToPackaging = () => {
    if (formulationRows.length === 0) {
      Alert.alert('Missing Ingredients', 'Please include at least one raw material ingredient.');
      return;
    }
    const hasZero = formulationRows.some((r) => (parseFloat(r.quantity_per_unit) || 0) <= 0);
    if (hasZero) {
      Alert.alert('Invalid Quantity', 'All ingredient quantities must be greater than 0.');
      return;
    }
    setCurrentStep(2);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goToDetails = () => {
    if (!selectedPackaging) {
      Alert.alert('Packaging Required', 'Please select a packaging container.');
      return;
    }
    const moqNum = parseInt(productMoq.replace(/[^0-9]/g, ''), 10) || 100;
    if (batchQtyNum < moqNum) {
      Alert.alert('Minimum Order Quantity', `The minimum batch quantity for this product is ${moqNum} units.`);
      return;
    }
    if (!companyName.trim()) {
      Alert.alert('Company Name Required', 'Please provide a company / business name for the quotation sheet.');
      return;
    }
    if (!contactPerson.trim()) {
      Alert.alert('Contact Person Required', 'Please provide a contact person.');
      return;
    }
    setCurrentStep(3);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ── Submit Inquiry to Sales Team ──
  const handleSubmitCustomization = async () => {
    setSubmitting(true);
    try {
      const me = await getMe();
      const clientId = me?.business_client?.client_id ?? me?.businessClient?.client_id;

      if (!clientId) {
        Alert.alert('Account Notice', 'Could not locate your business profile. Please contact support.');
        return;
      }

      const ingredientsSummary = formulationRows
        .map(
          (r, idx) =>
            `${idx + 1}. ${r.raw_material_name} (${r.raw_material_sku || 'RM'}): ${r.quantity_per_unit} ${r.unit_of_measure} @ ₱${r.rate.toFixed(2)} = ₱${r.amount.toFixed(2)}`
        )
        .join('; ');

      const clientNotesFormatted = [
        `Company Name: ${companyName}`,
        `Contact Person: ${contactPerson}`,
        `Brand: ${brandName || 'Your Brand'}`,
        `Finished Product: ${productName} (${productCode})`,
        `Formulation Cost: ₱${calculatedFormulationCost.toFixed(2)}/unit`,
        `Packaging: ${selectedPackaging} ${packagingDimensions}`,
        `Printing: ${selectedFinish}`,
        `Net Weight: ${servingSize}`,
        `Batch Quantity: ${batchQtyNum} units`,
        `Price / Unit: ₱${pricePerUnit.toFixed(2)}`,
        `Total Price: ₱${totalPrice.toLocaleString()}`,
        `Terms: Commercial quotation & payment terms to be issued by Sales Agent | Lead time: 10-15 days | FOB: CDO | VAT Exclusive`,
        clientNotes ? `Client Notes: ${clientNotes}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const customizations = [
        {
          customization_type: 'Custom Rebrand & Packaging',
          packaging_type: `${selectedPackaging} ${packagingDimensions}`,
          packaging_finish: selectedFinish,
          serving_size: `${servingSize} × ${batchQtyNum} units`,
          formulation_notes: `Calculated Formulation Recipe (₱${calculatedFormulationCost.toFixed(2)}/unit): ${ingredientsSummary}`,
          client_notes: clientNotesFormatted,
        },
      ];

      const res = await submitInquiry(clientId, customizations);
      if (res?.inquiry?.inquiry_id) {
        setCreatedInquiryId(res.inquiry.inquiry_id);
      }
      setSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit customization. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalogMaterials = useMemo(() => {
    if (!materialSearchQuery.trim()) return catalogRawMaterials;
    const q = materialSearchQuery.toLowerCase();
    return catalogRawMaterials.filter(
      (m) => m.name.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [catalogRawMaterials, materialSearchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header Bar (No Stepper Tabs Bar) ── */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}
            onPress={() => {
              if (currentStep === 3) {
                setCurrentStep(2);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              } else if (currentStep === 2) {
                setCurrentStep(1);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Product Customization</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              {currentStep === 1
                ? 'Step 1: Formulation Recipe (Composite Item)'
                : currentStep === 2
                ? 'Step 2: Packaging, Branding & Client Info'
                : 'Step 3: Starter Package Details & Submit'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading formulation recipes and materials...
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ════════════════════════════════════════════════════════════════════
                PAGE 1: INGREDIENTS & COMPOSITE FORMULATION
               ════════════════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <View style={styles.pageBlock}>
                <View style={styles.sectionHeaderIntro}>
                  <Text style={[styles.modalHeadline, { color: colors.text }]}>Edit Composite Item</Text>
                  <Text style={[styles.modalSubheadline, { color: colors.textSecondary }]}>
                    Define the formulation recipe and per-unit raw material quantities for this finished product.
                  </Text>
                </View>

                {/* ── Composite Product Header Card with Live Formulation Cost ── */}
                <View
                  style={[
                    styles.compositeProductCard,
                    {
                      backgroundColor: isDarkMode ? '#0d1527' : '#f8fafc',
                      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={styles.compositeLeft}>
                    <View
                      style={[
                        styles.compositeIconBox,
                        {
                          backgroundColor: isDarkMode ? '#172554' : '#e0f2fe',
                          borderColor: isDarkMode ? '#1e3a8a' : '#bae6fd',
                        },
                      ]}
                    >
                      <Feather name="box" size={24} color="#2196F3" />
                    </View>
                    <View style={styles.compositeInfo}>
                      <Text style={[styles.compositeProductName, { color: colors.text }]}>
                        {productName}
                      </Text>
                      <Text style={styles.compositeProductCode}>{productCode}</Text>
                      <Text style={[styles.compositeCategoryNote, { color: colors.textSecondary }]}>
                        Composite Item / Bill of Materials (Strictly Raw Materials)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.compositeRight}>
                    <Text style={[styles.costLabel, { color: colors.textSecondary }]}>
                      Calculated Formulation Cost
                    </Text>
                    <View style={styles.costValueRow}>
                      <Text style={styles.costCurrencySymbol}>₱</Text>
                      <Text style={styles.costValueNumber}>{calculatedFormulationCost.toFixed(2)}</Text>
                      <Text style={[styles.costPerUnit, { color: colors.textSecondary }]}>/ unit</Text>
                    </View>
                  </View>
                </View>

                {/* ── Recipe Ingredients Table ── */}
                <View
                  style={[
                    styles.recipeTableContainer,
                    {
                      backgroundColor: isDarkMode ? '#0b1120' : '#ffffff',
                      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  {/* Table Header Row */}
                  <View
                    style={[
                      styles.tableHeaderRow,
                      {
                        backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                        borderBottomColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      },
                    ]}
                  >
                    <Text style={[styles.tableColHeader, styles.colIndex]}>#</Text>
                    <Text style={[styles.tableColHeader, styles.colItem]}>ITEM (RAW MATERIAL)</Text>
                    <Text style={[styles.tableColHeader, styles.colQty]}>QUANTITY (PER UNIT)</Text>
                    <Text style={[styles.tableColHeader, styles.colRate]}>RATE (₱)</Text>
                    <Text style={[styles.tableColHeader, styles.colAmount]}>AMOUNT (₱)</Text>
                    <Text style={[styles.tableColHeader, styles.colAction]}></Text>
                  </View>

                  {/* Table Rows */}
                  {formulationRows.map((row, idx) => (
                    <View
                      key={`${row.product_id}-${idx}`}
                      style={[
                        styles.tableDataRow,
                        {
                          borderBottomColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                          backgroundColor: idx % 2 === 1 ? (isDarkMode ? '#0d1627' : '#fafafa') : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.cellIndex, { color: colors.textSecondary }]}>{idx + 1}</Text>

                      <View style={styles.cellItem}>
                        <TouchableOpacity
                          style={[
                            styles.materialDropdownBtn,
                            {
                              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                            },
                          ]}
                          onPress={() => {
                            setRawMaterialPickerIndex(idx);
                            setMaterialSearchQuery('');
                            setRawMaterialModalVisible(true);
                          }}
                        >
                          <Text style={[styles.materialDropdownText, { color: colors.text }]} numberOfLines={1}>
                            {row.raw_material_name} ({row.raw_material_sku || 'RM'}) — ₱{row.rate.toFixed(2)}/{row.unit_of_measure}
                          </Text>
                          <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cellQty}>
                        <View
                          style={[
                            styles.qtyInputWrap,
                            {
                              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                            },
                          ]}
                        >
                          <TextInput
                            style={[styles.qtyInputText, { color: colors.text }]}
                            value={row.quantity_per_unit}
                            onChangeText={(text) => handleUpdateRowQuantity(idx, text)}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                          />
                          <Text style={[styles.qtyUnitLabel, { color: colors.textSecondary }]}>
                            {row.unit_of_measure}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.cellRate, { color: colors.textSecondary }]}>
                        ₱{row.rate.toFixed(2)}
                      </Text>

                      <Text style={[styles.cellAmount, { color: colors.text }]}>
                        ₱{row.amount.toFixed(2)}
                      </Text>

                      <TouchableOpacity
                        style={styles.cellActionBtn}
                        onPress={() => handleRemoveRow(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Raw Material Button */}
                  <View style={styles.addMaterialFooter}>
                    <TouchableOpacity
                      style={[
                        styles.addMaterialBtn,
                        {
                          borderColor: isDarkMode ? '#1e3a8a' : '#bfdbfe',
                          backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.08)' : '#eff6ff',
                        },
                      ]}
                      onPress={handleAddRawMaterialRow}
                    >
                      <Ionicons name="add" size={16} color="#2196F3" />
                      <Text style={styles.addMaterialBtnText}>Add Raw Material</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Page 1 Bottom Navigation */}
                <TouchableOpacity
                  style={[styles.primaryNavBtn, { backgroundColor: '#2196F3' }]}
                  onPress={goToPackaging}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryNavBtnText}>Proceed to Packaging</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                PAGE 2: PACKAGING PART ("after the ingredients, the next page should be packaging")
               ════════════════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <View style={styles.pageBlock}>
                <View style={styles.sectionHeaderIntro}>
                  <Text style={[styles.modalHeadline, { color: colors.text }]}>Packaging &amp; Private Labeling</Text>
                  <Text style={[styles.modalSubheadline, { color: colors.textSecondary }]}>
                    Select container type, brand name, net weight, label specifications, and batch volume.
                  </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Packaging Container */}
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Packaging Container *</Text>
                  <View style={styles.packagingGrid}>
                    {packagingOptionsList.map((pkg) => {
                      const isSelected = selectedPackaging.toLowerCase() === pkg.name.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={pkg.id}
                          style={[
                            styles.packagingCardItem,
                            {
                              backgroundColor: isSelected
                                ? isDarkMode
                                  ? 'rgba(33, 150, 243, 0.15)'
                                  : '#eff6ff'
                                : isDarkMode
                                ? '#1e293b'
                                : '#f8fafc',
                              borderColor: isSelected ? '#2196F3' : colors.border,
                            },
                          ]}
                          onPress={() => setSelectedPackaging(pkg.name)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.pkgHeaderRow}>
                            <MaterialCommunityIcons
                              name={
                                pkg.name.toLowerCase().includes('bottle')
                                  ? 'bottle-tonic-outline'
                                  : pkg.name.toLowerCase().includes('jar')
                                  ? 'cup-outline'
                                  : pkg.name.toLowerCase().includes('sachet')
                                  ? 'ticket-outline'
                                  : pkg.name.toLowerCase().includes('box')
                                  ? 'package-variant'
                                  : 'package-variant-closed'
                              }
                              size={20}
                              color={isSelected ? '#2196F3' : colors.textSecondary}
                            />
                            {isSelected && <Ionicons name="checkmark-circle" size={18} color="#2196F3" />}
                          </View>
                          <Text
                            style={[
                              styles.pkgItemName,
                              { color: isSelected ? '#2196F3' : colors.text },
                              isSelected && { fontWeight: '700' },
                            ]}
                          >
                            {pkg.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Packaging Printing & Dimensions */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                        Printing / Label Style
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={selectedFinish}
                        onChangeText={setSelectedFinish}
                        placeholder="e.g. STICKER LABEL"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                        Container Dimensions
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={packagingDimensions}
                        onChangeText={setPackagingDimensions}
                        placeholder="e.g. 12X20cm"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  {/* Brand Name & Net Weight */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                        Your Brand Name *
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={brandName}
                        onChangeText={setBrandName}
                        placeholder="e.g. Your Brand"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                        Net Weight *
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={servingSize}
                        onChangeText={setServingSize}
                        placeholder="e.g. 120g"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  {/* Batch Order Quantity with MOQ */}
                  <View style={styles.moqRowHeader}>
                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                      Batch Order Quantity (units / pouches) *
                    </Text>
                    <View style={styles.moqBadge}>
                      <Text style={styles.moqBadgeText}>MOQ: {productMoq}</Text>
                    </View>
                  </View>
                  <TextInput
                    style={[
                      styles.inputField,
                      styles.qtyField,
                      {
                        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={colors.textSecondary}
                  />

                  {/* Brand Logo Upload */}
                  <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                    Upload Brand Logo / Artwork Preview (Optional)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadLogoBox,
                      {
                        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      },
                    ]}
                    onPress={handlePickLogo}
                  >
                    {uploadedLogoUri ? (
                      <View style={styles.uploadedLogoWrap}>
                        <Image source={{ uri: uploadedLogoUri }} style={styles.uploadedLogoImg} />
                        <Text style={styles.changeLogoText}>Tap to change artwork</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholderInner}>
                        <Ionicons name="image-outline" size={26} color="#2196F3" />
                        <Text style={[styles.uploadLogoPrompt, { color: colors.text }]}>
                          Tap to attach custom brand logo / label graphic
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* ── Sub-Section: Company & Client Information ── */}
                <View style={[styles.sectionHeaderIntro, { marginTop: 16 }]}>
                  <Text style={[styles.modalHeadline, { color: colors.text }]}>Company Information</Text>
                  <Text style={[styles.modalSubheadline, { color: colors.textSecondary }]}>
                    Provide your business client details to be listed on the official starter package specification.
                  </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Company Name *</Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="e.g. BManny Client Co."
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Contact Person *</Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={contactPerson}
                        onChangeText={setContactPerson}
                        placeholder="e.g. Juan Dela Cruz"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={[styles.rowTwoCols, { marginTop: 12 }]}>
                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Quotation Date</Text>
                      <View
                        style={[
                          styles.inputFieldReadOnly,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.readOnlyText, { color: colors.text }]}>{todayDate}</Text>
                      </View>
                    </View>

                    <View style={styles.colHalf}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Customer Support</Text>
                      <View
                        style={[
                          styles.inputFieldReadOnly,
                          {
                            backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.readOnlyText, { color: colors.text }]}>BManny Partners Inc.</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── Sub-Section: Special Notes & Instructions ── */}
                <View style={[styles.sectionHeaderIntro, { marginTop: 16 }]}>
                  <Text style={[styles.modalHeadline, { color: colors.text }]}>Special Instructions & Notes</Text>
                  <Text style={[styles.modalSubheadline, { color: colors.textSecondary }]}>
                    Enter any formulation tweaks, packaging preferences, or logistics instructions for our sales team.
                  </Text>
                </View>

                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[
                      styles.inputField,
                      {
                        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                        borderColor: colors.border,
                        color: colors.text,
                        minHeight: 70,
                        textAlignVertical: 'top',
                      },
                    ]}
                    multiline
                    numberOfLines={3}
                    value={clientNotes}
                    onChangeText={setClientNotes}
                    placeholder="Enter any special packaging, shipping, or formulation requests..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Page 2 Bottom Navigation */}
                <View style={styles.dualNavButtons}>
                  <TouchableOpacity
                    style={[styles.secondaryNavBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setCurrentStep(1);
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.secondaryNavBtnText, { color: colors.text }]}>Back to Ingredients</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryNavBtn, styles.flexOne, { backgroundColor: '#2196F3' }]}
                    onPress={goToDetails}
                  >
                    <Text style={styles.primaryNavBtnText}>Proceed to Specification Sheet</Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                PAGE 3: STARTER PACKAGE SPECIFICATION SHEET & SUBMIT
               ════════════════════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <View style={styles.pageBlock}>
                <View style={styles.sectionHeaderIntro}>
                  <Text style={[styles.modalHeadline, { color: colors.text }]}>
                    Starter Package Specification Sheet
                  </Text>
                  <Text style={[styles.modalSubheadline, { color: colors.textSecondary }]}>
                    Official BMANNY custom starter package details and commercial quotation breakdown.
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.sheetHorizontalScroll}>
                  <View style={[styles.sheetTableContainer, { borderColor: '#475569' }]}>
                    {/* Row 1: Pink Header "COMPANY INFO" */}
                    <View style={styles.sheetPinkHeaderRow}>
                      <Text style={styles.sheetPinkHeaderText}>COMPANY INFO</Text>
                    </View>

                    {/* Row 2: Company Info 2-Column Details */}
                    <View style={styles.sheetInfoGrid}>
                      <View style={styles.sheetInfoColLeft}>
                        <View style={styles.sheetInfoLine}>
                          <Text style={styles.sheetInfoLabel}>Company Name:</Text>
                          <Text style={styles.sheetInfoVal} numberOfLines={1}>
                            {companyName}
                          </Text>
                        </View>
                        <View style={styles.sheetInfoLine}>
                          <Text style={styles.sheetInfoLabel}>Contact Person:</Text>
                          <Text style={styles.sheetInfoVal} numberOfLines={1}>
                            {contactPerson}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.sheetInfoColRight}>
                        <View style={styles.sheetInfoLine}>
                          <Text style={styles.sheetInfoLabel}>Date:</Text>
                          <Text style={styles.sheetInfoVal}>{todayDate}</Text>
                        </View>
                        <View style={styles.sheetInfoLine}>
                          <Text style={styles.sheetInfoLabel}>Customer Support:</Text>
                          <Text style={styles.sheetInfoVal}>BManny Partners Inc.</Text>
                        </View>
                      </View>
                    </View>

                    {/* Row 3: Yellow Package Banner */}
                    <View style={styles.sheetYellowBannerRow}>
                      <Text style={styles.sheetYellowBannerText}>
                        {productName.toUpperCase()} STARTER PACKAGE
                      </Text>
                    </View>

                    {/* Row 4: Main Columns Header (WITHOUT THE IMAGE / PRESENTATION COLUMN) */}
                    <View style={styles.sheetColHeaderRow}>
                      <View style={[styles.sheetTh, styles.sheetColPkgDetails]}>
                        <Text style={styles.sheetThText}>PACKAGING DETAILS</Text>
                      </View>
                      <View style={[styles.sheetTh, styles.sheetColMoq]}>
                        <Text style={styles.sheetThText}>MOQ</Text>
                      </View>
                      <View style={[styles.sheetTh, styles.sheetColPriceUnit]}>
                        <Text style={styles.sheetThText}>PRICE/UNIT</Text>
                      </View>
                      <View style={[styles.sheetTh, styles.sheetColPriceTotal]}>
                        <Text style={styles.sheetThText}>PRICE / TOTAL</Text>
                      </View>
                    </View>

                    {/* Row 5: Product Customization Data Row (WITHOUT THE IMAGE / PRESENTATION COLUMN) */}
                    <View style={styles.sheetDataRow}>
                      {/* Column 1: Packaging Details */}
                      <View style={[styles.sheetTd, styles.sheetColPkgDetails, styles.sheetDetailsPadding]}>
                        <View style={styles.sheetSpecItem}>
                          <Text style={styles.sheetSpecLabel}>PRODUCT NAME:</Text>
                          <Text style={styles.sheetSpecValueRed}>{productName.toUpperCase()}</Text>
                        </View>

                        <View style={styles.sheetSpecItem}>
                          <Text style={styles.sheetSpecLabel}>PRIMARY:</Text>
                          <Text style={styles.sheetSpecValueRed}>
                            {selectedPackaging.toUpperCase()} {packagingDimensions.toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.sheetSpecItem}>
                          <Text style={styles.sheetSpecLabel}>PRINTING:</Text>
                          <Text style={styles.sheetSpecValueRed}>{selectedFinish.toUpperCase()}</Text>
                        </View>

                        <View style={styles.sheetSpecItem}>
                          <Text style={styles.sheetSpecLabel}>NET WT.:</Text>
                          <Text style={styles.sheetSpecValueRed}>{servingSize.toUpperCase()}</Text>
                        </View>

                        <View style={styles.sheetSpecItem}>
                          <Text style={styles.sheetSpecLabel}>INGREDIENTS:</Text>
                          <Text style={[styles.sheetSpecValueRed, styles.sheetIngredientsRedItalic]}>
                            {ingredientsDisplayText}
                          </Text>
                        </View>
                      </View>

                      {/* Column 2: MOQ */}
                      <View style={[styles.sheetTd, styles.sheetColMoq, styles.sheetCenterAlign]}>
                        <Text style={styles.sheetValueRedBold}>
                          {batchQtyNum} {selectedPackaging.toLowerCase().includes('pouch') ? 'pouch' : 'units'}
                        </Text>
                      </View>

                      {/* Column 3: Price / Unit */}
                      <View style={[styles.sheetTd, styles.sheetColPriceUnit, styles.sheetCenterAlign]}>
                        <Text style={styles.sheetValueRedBold}>₱{pricePerUnit.toFixed(2)}</Text>
                      </View>

                      {/* Column 4: Total Amount */}
                      <View style={[styles.sheetTd, styles.sheetColPriceTotal, styles.sheetCenterAlign]}>
                        <Text style={styles.sheetValueRedBold}>
                          ₱ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>

                    {/* Row 6: Commercial Notice Row */}
                    <View style={styles.sheetTermsBlockRow}>
                      <View style={styles.sheetTermsLabelCol}>
                        <Text style={styles.sheetTermsBlockLabel}>COMMERCIAL TERMS</Text>
                      </View>
                      <View style={styles.sheetTermsTextCol}>
                        <Text style={styles.sheetTermLine}>• Quotation and commercial payment terms handled by Sales Agent</Text>
                        <Text style={styles.sheetTermLine}>• Payment via GCash or Bank Transfer available upon quote issuance</Text>
                      </View>
                      <View style={styles.sheetLeadTimeCol}>
                        <Text style={styles.sheetTermLine}>• Standard Order Lead Time 10-15 days</Text>
                      </View>
                    </View>

                    {/* Row 7: Pink Header "TERMS & SPECIFICATIONS" */}
                    <View style={styles.sheetPinkHeaderRow}>
                      <Text style={styles.sheetPinkHeaderText}>TERMS & SPECIFICATIONS</Text>
                    </View>

                    {/* Row 8: FOB & VAT Information */}
                    <View style={styles.sheetFobVatRow}>
                      <View style={styles.sheetFobVatItem}>
                        <Text style={styles.sheetFobLabel}>FOB:</Text>
                        <Text style={styles.sheetValueRedBold}>CDO</Text>
                      </View>
                      <View style={styles.sheetFobVatItem}>
                        <Text style={styles.sheetFobLabel}>VAT:</Text>
                        <Text style={styles.sheetValueRedBold}>VAT EXCLUSIVE</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Step 3 Bottom Navigation & Submission */}
                <View style={styles.dualNavButtons}>
                  <TouchableOpacity
                    style={[styles.secondaryNavBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setCurrentStep(2);
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.secondaryNavBtnText, { color: colors.text }]}>Back to Packaging & Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryNavBtn,
                      styles.flexOne,
                      { backgroundColor: '#2196F3' },
                      submitting && { opacity: 0.7 },
                    ]}
                    onPress={handleSubmitCustomization}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryNavBtnText}>Submit Customization</Text>
                        <Ionicons name="checkmark-done" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Raw Material Selection Modal ── */}
        <Modal
          visible={rawMaterialModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setRawMaterialModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Raw Material</Text>
                <TouchableOpacity
                  onPress={() => setRawMaterialModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search raw material name, SKU, or category..."
                  placeholderTextColor={colors.textSecondary}
                  value={materialSearchQuery}
                  onChangeText={setMaterialSearchQuery}
                />
              </View>

              <ScrollView style={styles.materialListScroll}>
                {filteredCatalogMaterials.map((mat) => {
                  const isCurrent =
                    rawMaterialPickerIndex !== null &&
                    formulationRows[rawMaterialPickerIndex]?.product_id === mat.product_id;

                  return (
                    <TouchableOpacity
                      key={mat.product_id}
                      style={[
                        styles.materialItemRow,
                        { borderBottomColor: isDarkMode ? '#1e293b' : '#f1f5f9' },
                        isCurrent && { backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.15)' : '#eff6ff' },
                      ]}
                      onPress={() => handleSelectRawMaterial(mat)}
                    >
                      <View style={styles.materialItemInfo}>
                        <View style={styles.materialNameSkuRow}>
                          <Text style={[styles.materialItemName, { color: colors.text }]}>{mat.name}</Text>
                          <Text style={styles.materialSkuBadge}>{mat.sku || 'RM'}</Text>
                        </View>
                        <Text style={[styles.materialCategoryText, { color: colors.textSecondary }]}>
                          {mat.category} • Rate: ₱{(mat.rate || mat.price).toFixed(2)} / {mat.unit_of_measure || 'kg'}
                        </Text>
                      </View>

                      <View style={styles.materialPriceCol}>
                        <Text style={[styles.materialRateText, { color: '#2196F3' }]}>
                          ₱{(mat.rate || mat.price).toFixed(2)}
                        </Text>
                        <Text style={[styles.materialUnitText, { color: colors.textSecondary }]}>
                          /{mat.unit_of_measure || 'kg'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── SweetAlert Success Modal ── */}
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

              <Text style={[styles.sweetAlertTitle, { color: colors.text }]}>Customization Submitted! 🎉</Text>
              <Text style={[styles.sweetAlertDesc, { color: colors.textSecondary }]}>
                Your starter package specification ({productName}), formulation ingredients, and commercial payment terms
                have been submitted to the sales team for formal review.
              </Text>

              {createdInquiryId && (
                <View style={[styles.inquiryBadge, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.inquiryBadgeText, { color: colors.text }]}>
                    Inquiry Reference: #{createdInquiryId}
                  </Text>
                </View>
              )}

              <View style={styles.sweetAlertButtonsRow}>
                <TouchableOpacity
                  style={[styles.sweetAlertButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.push('/orders');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sweetAlertButtonText}>Track My Inquiries</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sweetAlertSecondaryBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    router.push('/home');
                  }}
                >
                  <Text style={[styles.sweetAlertSecondaryBtnText, { color: colors.text }]}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageBlock: {
    gap: 16,
  },
  sectionHeaderIntro: {
    marginBottom: 2,
  },
  modalHeadline: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubheadline: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  /* ── Page 1: Composite Product Card ── */
  compositeProductCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'column',
    gap: 12,
  },
  compositeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compositeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compositeInfo: {
    flex: 1,
  },
  compositeProductName: {
    fontSize: 16,
    fontWeight: '800',
  },
  compositeProductCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  compositeCategoryNote: {
    fontSize: 11,
    marginTop: 2,
  },
  compositeRight: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  costValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  costCurrencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2196F3',
  },
  costValueNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2196F3',
    letterSpacing: -0.5,
  },
  costPerUnit: {
    fontSize: 12,
    marginLeft: 3,
  },

  /* ── Recipe Table ── */
  recipeTableContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colIndex: {
    width: 22,
    textAlign: 'center',
  },
  colItem: {
    flex: 2.2,
    paddingLeft: 6,
  },
  colQty: {
    flex: 1.4,
    textAlign: 'center',
  },
  colRate: {
    flex: 1.1,
    textAlign: 'right',
  },
  colAmount: {
    flex: 1.2,
    textAlign: 'right',
    paddingRight: 4,
  },
  colAction: {
    width: 24,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  cellIndex: {
    width: 22,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cellItem: {
    flex: 2.2,
    paddingLeft: 6,
  },
  materialDropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  materialDropdownText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cellQty: {
    flex: 1.4,
    paddingHorizontal: 4,
  },
  qtyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyInputText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    flex: 1,
    padding: 0,
    textAlign: 'center',
  },
  qtyUnitLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  cellRate: {
    flex: 1.1,
    fontSize: 11,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cellAmount: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    paddingRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cellActionBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMaterialFooter: {
    padding: 12,
  },
  addMaterialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addMaterialBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
  },

  /* ── Form Cards (Packaging & Terms) ── */
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  inputFieldReadOnly: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  packagingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packagingCardItem: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  pkgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pkgItemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  moqRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moqBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 10,
  },
  moqBadgeText: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: '700',
  },
  qtyField: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    fontSize: 15,
  },
  uploadLogoBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholderInner: {
    alignItems: 'center',
    gap: 4,
  },
  uploadLogoPrompt: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadedLogoWrap: {
    alignItems: 'center',
  },
  uploadedLogoImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  changeLogoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 4,
  },

  /* ── Terms Selection Card ── */
  termSelectCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  termSelectCardActive: {
    borderWidth: 1.5,
  },
  termRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termMainText: {
    fontSize: 13,
    fontWeight: '700',
  },
  termSubText: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  methodChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountInfoCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 3,
  },
  accountIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  accountTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountDetailLine: {
    fontSize: 12,
  },
  accountBold: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  /* ════════════════════════════════════════════════════════════════════
      PAGE 4: OFFICIAL DETAILS SHEET (WITHOUT IMAGE / PRESENTATION COLUMN)
     ════════════════════════════════════════════════════════════════════ */
  sheetHorizontalScroll: {
    borderRadius: 8,
  },
  sheetTableContainer: {
    width: 520,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  sheetPinkHeaderRow: {
    backgroundColor: '#fce7f3',
    borderBottomWidth: 1,
    borderColor: '#475569',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPinkHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  sheetInfoGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#475569',
  },
  sheetInfoColLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  sheetInfoColRight: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  sheetInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    width: 105,
  },
  sheetInfoVal: {
    fontSize: 10,
    fontWeight: '500',
    color: '#0f172a',
    flex: 1,
  },
  sheetYellowBannerRow: {
    backgroundColor: '#fef08a',
    borderBottomWidth: 1,
    borderColor: '#475569',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetYellowBannerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  sheetColHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#ffffff',
  },
  sheetTh: {
    borderRightWidth: 1,
    borderColor: '#475569',
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetThText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  sheetColPkgDetails: {
    width: 230,
  },
  sheetColMoq: {
    width: 85,
  },
  sheetColPriceUnit: {
    width: 95,
  },
  sheetColPriceTotal: {
    width: 110,
    borderRightWidth: 0,
  },
  sheetDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#ffffff',
  },
  sheetTd: {
    borderRightWidth: 1,
    borderColor: '#475569',
  },
  sheetDetailsPadding: {
    padding: 6,
    gap: 4,
  },
  sheetSpecItem: {
    flexDirection: 'column',
    gap: 1,
  },
  sheetSpecLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSpecValueRed: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: -0.2,
  },
  sheetIngredientsRedItalic: {
    fontStyle: 'italic',
    lineHeight: 14,
  },

  sheetCenterAlign: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  sheetValueRedBold: {
    fontSize: 11,
    fontWeight: '900',
    color: '#dc2626',
    textAlign: 'center',
  },
  sheetTermsBlockRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  sheetTermsLabelCol: {
    width: 120,
  },
  sheetTermsBlockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetTermsTextCol: {
    flex: 1.5,
    gap: 1,
  },
  sheetLeadTimeCol: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  sheetTermLine: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetFobVatRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 24,
  },
  sheetFobVatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetFobLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetBankDetailsRow: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  sheetBankAcntText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#dc2626',
  },
  sheetBankNameText: {
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#dc2626',
  },

  /* ── Step-by-Step Navigation Buttons ── */
  primaryNavBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryNavBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryNavBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryNavBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dualNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  flexOne: {
    flex: 1,
  },

  /* ── Modals ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 13,
    flex: 1,
    padding: 0,
  },
  materialListScroll: {
    maxHeight: 350,
  },
  materialItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 6,
  },
  materialItemInfo: {
    flex: 1,
  },
  materialNameSkuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  materialItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  materialSkuBadge: {
    fontSize: 10,
    color: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  materialCategoryText: {
    fontSize: 11,
    marginTop: 2,
  },
  materialPriceCol: {
    alignItems: 'flex-end',
  },
  materialRateText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  materialUnitText: {
    fontSize: 10,
  },

  /* ── SweetAlert Success Modal ── */
  sweetAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sweetAlertCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  sweetAlertIconContainer: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sweetAlertOuterCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweetAlertInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sparkLine: {
    position: 'absolute',
    borderRadius: 2,
  },
  sparkTopLeft: { width: 4, height: 10, top: 4, left: 16, transform: [{ rotate: '-35deg' }] },
  sparkLeft: { width: 10, height: 4, left: 2, top: 40 },
  sparkBottomLeft: { width: 4, height: 10, bottom: 4, left: 16, transform: [{ rotate: '35deg' }] },
  sparkTopRight: { width: 4, height: 10, top: 4, right: 16, transform: [{ rotate: '35deg' }] },
  sparkRight: { width: 10, height: 4, right: 2, top: 40 },
  sparkBottomRight: { width: 4, height: 10, bottom: 4, right: 16, transform: [{ rotate: '-35deg' }] },
  sweetAlertTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  sweetAlertDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  inquiryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  inquiryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sweetAlertButtonsRow: {
    width: '100%',
    gap: 10,
  },
  sweetAlertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sweetAlertButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  sweetAlertSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  sweetAlertSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
