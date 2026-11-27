import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { submitNewProductRequest, uploadInquiryDesign } from "../services/api";

const CATEGORIES = [
  "Herbal Tea",
  "Powdered Drink",
  "Coffee Mix",
  "Capsules",
  "Liquid / Syrup",
  "Skincare",
  "Other",
];

const PACKAGING_OPTIONS = ["Pouch", "Sachet", "Bottle", "Box", "Jar"];

const QUANTITY_OPTIONS = [
  "100–500 units",
  "1,000 units",
  "5,000 units",
  "10,000+ units",
];

export default function RequestProductScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const { colors, isDarkMode } = useTheme();

  const [productName, setProductName] = useState(
    typeof params.query === "string" ? params.query : "",
  );
  const [category, setCategory] = useState("Herbal Tea");
  const [packagingType, setPackagingType] = useState("Pouch");
  const [targetQuantity, setTargetQuantity] = useState("100–500 units");
  const [keyIngredients, setKeyIngredients] = useState("");
  const [formulationNotes, setFormulationNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const surface = isDarkMode ? "#121826" : "#ffffff";
  const muted = isDarkMode ? "#1b2436" : "#f4f6fb";
  const border = isDarkMode ? "#26324a" : "#dbe3ef";

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Photo access needed",
        "Please allow photo library access to attach a reference image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReferenceImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert(
        "Product name required",
        "Please enter the name or concept of the product you want to request.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitNewProductRequest({
        product_name: productName.trim(),
        category,
        packaging_type: packagingType,
        target_quantity: targetQuantity,
        key_ingredients: keyIngredients.trim() || undefined,
        formulation_notes: formulationNotes.trim() || undefined,
        client_notes: clientNotes.trim() || undefined,
      });

      const inquiryId = response?.inquiry?.inquiry_id ?? null;
      if (referenceImage && inquiryId) {
        try {
          await uploadInquiryDesign(inquiryId, referenceImage);
        } catch {
          // Non-blocking: request itself already succeeded
        }
      }

      setSubmittedId(inquiryId);
    } catch (e: any) {
      Alert.alert(
        "Submission error",
        e?.message || "Unable to submit your product request right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId !== null) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.successWrap}>
          <View
            style={[
              s.successCard,
              { backgroundColor: surface, borderColor: border },
            ]}
          >
            <View style={s.successIconCircle}>
              <Ionicons name="checkmark-circle" size={44} color="#10b981" />
            </View>
            <Text style={[s.successTitle, { color: colors.text }]}>
              Product Request Sent!
            </Text>
            <Text style={[s.successRef, { color: "#2196F3" }]}>
              Inquiry #{submittedId} · Pending Feasibility Review
            </Text>
            <Text style={[s.successBody, { color: colors.textSecondary }]}>
              Your request for{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>
                {productName.trim()}
              </Text>{" "}
              has been routed directly to both{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>
                Sales
              </Text>{" "}
              and{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>
                Product Control
              </Text>
              . We'll notify you as soon as ingredient availability and options
              are reviewed.
            </Text>

            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => router.replace("/orders")}
            >
              <Ionicons name="receipt-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Track in My Inquiries</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.secondaryBtn, { borderColor: border }]}
              onPress={() => router.replace("/home")}
            >
              <Text style={[s.secondaryBtnText, { color: colors.text }]}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={[
            s.header,
            { backgroundColor: surface, borderBottomColor: border },
          ]}
        >
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: muted }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>
              Request a New Product
            </Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]}>
              Custom formulation & R&D feasibility inquiry
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View
            style={[
              s.infoBanner,
              {
                backgroundColor: isDarkMode ? "#0f2238" : "#eff6ff",
                borderColor: isDarkMode ? "#1e3a5f" : "#bfdbfe",
              },
            ]}
          >
            <Ionicons
              name="flask-outline"
              size={20}
              color="#2196F3"
              style={{ marginTop: 1 }}
            />
            <Text
              style={[
                s.infoBannerText,
                { color: isDarkMode ? "#cbd5e1" : "#1e3a8a" },
              ]}
            >
              Don't see the product you want in our catalog? Tell us your idea
              — your request goes directly to{" "}
              <Text style={{ fontWeight: "700" }}>
                Sales & Product Control
              </Text>{" "}
              for free feasibility review.
            </Text>
          </View>

          {/* Product Name */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Proposed Product Name / Concept *
            </Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Turmeric Ginger Tea, Malunggay Coffee, Collagen Drink"
              placeholderTextColor={colors.textSecondary}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* Category Chips */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Product Category / Format
            </Text>
            <View style={s.chipWrap}>
              {CATEGORIES.map((item) => {
                const active = category === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      s.chip,
                      {
                        backgroundColor: active ? "#2196F3" : muted,
                        borderColor: active ? "#2196F3" : border,
                      },
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: active ? "#ffffff" : colors.text },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Preferred Packaging */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Preferred Packaging
            </Text>
            <View style={s.chipWrap}>
              {PACKAGING_OPTIONS.map((item) => {
                const active = packagingType === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      s.chip,
                      {
                        backgroundColor: active ? "#2196F3" : muted,
                        borderColor: active ? "#2196F3" : border,
                      },
                    ]}
                    onPress={() => setPackagingType(item)}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: active ? "#ffffff" : colors.text },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Target Quantity */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Estimated Initial Quantity
            </Text>
            <View style={s.chipWrap}>
              {QUANTITY_OPTIONS.map((item) => {
                const active = targetQuantity === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      s.chip,
                      {
                        backgroundColor: active ? "#10b981" : muted,
                        borderColor: active ? "#10b981" : border,
                      },
                    ]}
                    onPress={() => setTargetQuantity(item)}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: active ? "#ffffff" : colors.text },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Key Ingredients */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Key Ingredients / Active Herbs (Optional)
            </Text>
            <TextInput
              style={[
                s.input,
                s.textArea,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Moringa, Guyabano, Stevia, Vitamin C, Marine Collagen..."
              placeholderTextColor={colors.textSecondary}
              value={keyIngredients}
              onChangeText={setKeyIngredients}
              multiline
            />
          </View>

          {/* Formulation / Target Benefits */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Desired Taste, Benefits or Notes (Optional)
            </Text>
            <TextInput
              style={[
                s.input,
                s.textArea,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Sugar-free, immunity booster, similar to a popular market brand..."
              placeholderTextColor={colors.textSecondary}
              value={formulationNotes}
              onChangeText={setFormulationNotes}
              multiline
            />
          </View>

          {/* Target Launch / Extra Notes */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Target Launch Date or Budget Notes (Optional)
            </Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Planning to launch next quarter, ₱15k starter budget"
              placeholderTextColor={colors.textSecondary}
              value={clientNotes}
              onChangeText={setClientNotes}
            />
          </View>

          {/* Optional Reference Image */}
          <View style={s.field}>
            <Text style={[s.label, { color: colors.text }]}>
              Reference / Inspiration Photo (Optional)
            </Text>
            <TouchableOpacity
              style={[
                s.uploadBox,
                { backgroundColor: surface, borderColor: border },
              ]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {referenceImage ? (
                <View style={s.previewRow}>
                  <Image
                    source={{ uri: referenceImage }}
                    style={s.previewImg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.previewTitle, { color: colors.text }]}>
                      Reference image attached
                    </Text>
                    <Text
                      style={[s.previewSub, { color: colors.textSecondary }]}
                    >
                      Tap to change photo
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReferenceImage(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={26}
                    color="#2196F3"
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={s.uploadTitle}>
                    Upload Packaging or Product Peg
                  </Text>
                  <Text
                    style={[s.uploadSub, { color: colors.textSecondary }]}
                  >
                    Optional — helps Product Control & Sales understand your
                    vision
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.primaryBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={17} color="#ffffff" />
                <Text style={s.primaryBtnText}>Submit New Product Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 42,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 18,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14.5,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    color: "#2196F3",
    fontSize: 13.5,
    fontWeight: "800",
  },
  uploadSub: {
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 4,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  previewTitle: { fontSize: 13.5, fontWeight: "700" },
  previewSub: { fontSize: 11.5, marginTop: 2 },
  primaryBtn: {
    backgroundColor: "#2196F3",
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    width: "100%",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 4,
  },
  successRef: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  successBody: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
});
