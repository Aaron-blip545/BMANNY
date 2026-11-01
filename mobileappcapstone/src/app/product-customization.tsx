import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import {
  getMe,
  getProducts,
  submitInquiry,
  uploadInquiryDesign,
} from "../services/api";

type Tier = "starter" | "gold" | "elite";
type Pack = {
  id: Tier;
  title: string;
  desc: string;
  moq: string;
  packaging: string;
  label: string;
  weight: string;
  lead: string;
  cost: string;
  initialPrice: number;
  terms: string;
  publicIngredients: string;
  costBreakdown: { label: string; amount: number; quantity: string }[];
  packageNotes: string;
  allowsRequest: boolean;
};
const peso = (amount: number) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
const PACKAGE_PREVIEWS: Record<Tier, number> = {
  starter: require("../../assets/images/packages/ashigo-starter.jpg"),
  gold: require("../../assets/images/packages/ashigo-gold.jpg"),
  elite: require("../../assets/images/packages/ashigo-elite.jpg"),
};
const ASHIGO_PRODUCT_IMAGE = require("../../assets/images/ashigo-plus.jpg");
const ASHIGO_PUBLIC_INGREDIENTS =
  "Purple corn kernel, mangosteen rind extract, moringa leaves extract, guyabano fruit extract, ashitaba leaves extract, barley grass extract, spirulina leaves extract, ampalaya leaves extract, and chia seeds.";
const DEFAULT_PACKAGES: Pack[] = [
  {
    id: "starter",
    title: "Starter Package",
    desc: "A practical first run for a new brand.",
    moq: "100 pouches",
    packaging: "Stand-up pouch, 12 × 20 cm",
    label: "Sticker label",
    weight: "120 g",
    lead: "10–15 business days",
    cost: "Starting at ₱7,900",
    terms: "50% before production · 50% before pickup",
    initialPrice: 7900,
    publicIngredients: "Corn coffee with malunggay and mangosteen.",
    costBreakdown: [
      { label: "Price per pouch", amount: 79, quantity: "100 pouches" },
    ],
    packageNotes:
      "A practical first production run. FOB CDO · VAT exclusive.",
    allowsRequest: false,
  },
  {
    id: "gold",
    title: "Gold Package",
    desc: "For brands ready for full-color pouch packaging.",
    moq: "5,000 pouches",
    packaging: "Stand-up pouch, 12 × 20 cm",
    label: "Full-color pouch print",
    weight: "120 g",
    lead: "40–60 days after layout approval",
    cost: "Initial package cost from ₱99,900",
    terms: "Package, cylinder, and production milestones apply",
    initialPrice: 99900,
    publicIngredients:
      "Corn coffee with malunggay and mangosteen, plus up to 6 requested herbal ingredients subject to Product Control review.",
    costBreakdown: [
      { label: "Packaging cost", amount: 50000, quantity: "₱10 × 5,000 pouches" },
      { label: "Cylinder cost", amount: 22400, quantity: "One-time payment" },
      { label: "Production payment", amount: 27500, quantity: "₱55 × 500 pouches" },
    ],
    packageNotes:
      "Packaging is purchased first. Remaining packaging may be kept for the next batch, subject to storage terms. FOB CDO · VAT exclusive.",
    allowsRequest: true,
  },
  {
    id: "elite",
    title: "Elite Package",
    desc: "For larger production requirements and premium presentation.",
    moq: "10,000 pouches",
    packaging: "Stand-up pouch, 12 × 20 cm",
    label: "Full-color pouch print",
    weight: "120 g",
    lead: "40–60 days after layout approval",
    cost: "Initial package cost from ₱142,400",
    terms: "Package, cylinder, and production milestones apply",
    initialPrice: 142400,
    publicIngredients:
      "Corn coffee with malunggay and mangosteen, plus up to 8 requested herbal ingredients subject to Product Control review.",
    costBreakdown: [
      { label: "Packaging cost", amount: 100000, quantity: "₱10 × 10,000 pouches" },
      { label: "Cylinder cost", amount: 22400, quantity: "One-time payment" },
      { label: "Production payment", amount: 20000, quantity: "₱50 × 400 pouches" },
    ],
    packageNotes:
      "Packaging is purchased first. Remaining packaging may be kept for the next batch, subject to storage terms. FOB CDO · VAT exclusive.",
    allowsRequest: true,
  },
];

export default function ProductCustomizationScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    product_code?: string;
    image?: string;
  }>();
  const [step, setStep] = useState<1 | 2 | 3>(1),
    [loading, setLoading] = useState(true),
    [submitting, setSubmitting] = useState(false),
    [success, setSuccess] = useState(false);
  const [productName, setProductName] = useState(
      params.name || "AshigoPlus Coffee Drink Mix",
    ),
    [code, setCode] = useState(params.product_code || "FP-0001"),
    [image, setImage] = useState(params.image || "");
  const [tier, setTier] = useState<Tier | null>(null),
    [company, setCompany] = useState(""),
    [contact, setContact] = useState(""),
    [brand, setBrand] = useState(""),
    [artwork, setArtwork] = useState<string | null>(null),
    [request, setRequest] = useState(""),
    [notes, setNotes] = useState(""),
    [inquiryId, setInquiryId] = useState<number | null>(null),
    [showIngredients, setShowIngredients] = useState(false),
    [breakdownPackage, setBreakdownPackage] = useState<Pack | null>(null);
  const [packageOptions, setPackageOptions] =
    useState<Pack[]>(DEFAULT_PACKAGES);
  const PACKAGES = packageOptions;
  const selected = useMemo(
    () => packageOptions.find((x) => x.id === tier) || null,
    [tier, packageOptions],
  );
  const isAshigo = productName.toLowerCase().includes("ashigo");
  const surface = isDarkMode ? "#131d31" : colors.card,
    muted = isDarkMode ? "#1d2a40" : "#f7faff",
    border = isDarkMode ? "#31425e" : colors.border;
  useEffect(() => {
    (async () => {
      try {
        const [me, all] = await Promise.all([
          getMe().catch(() => null),
          getProducts().catch(() => null),
        ]);
        const c = me?.business_client || me?.businessClient;
        setCompany(c?.business_name || me?.full_name || "");
        setContact(c?.contact_person || me?.full_name || "");
        const p = (Array.isArray(all) ? all : all?.data || []).find(
          (x: any) =>
            (params.id &&
              String(x.id || x.product_type_id) === String(params.id)) ||
            (params.name &&
              String(x.name).toLowerCase() ===
                String(params.name).toLowerCase()),
        );
        if (p) {
          setProductName(p.name || productName);
          setCode(p.product_code || code);
          setImage(p.image_url || image);
          if (Array.isArray(p.packages) && p.packages.length)
            setPackageOptions(
              p.packages.map((x: any) => {
                const fallback = DEFAULT_PACKAGES.find(
                  (item) => item.id === x.slug,
                );
                return {
                id: x.slug as Tier,
                title: x.name,
                desc: x.description || "",
                moq: Number(x.minimum_quantity).toLocaleString() + " pouches",
                packaging: x.packaging_details,
                label: x.label_details,
                weight: x.net_weight,
                lead: x.lead_time_text,
                cost:
                  "₱" +
                  Number(x.initial_price).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  }),
                initialPrice: Number(x.initial_price),
                terms: x.payment_terms,
                publicIngredients:
                  x.public_ingredients || fallback?.publicIngredients || "",
                costBreakdown: Array.isArray(x.cost_breakdown)
                  ? x.cost_breakdown.map((line: any) => ({
                      label: line.label,
                      amount: Number(line.amount),
                      quantity: line.quantity || "",
                    }))
                  : fallback?.costBreakdown || [],
                packageNotes: x.package_notes || fallback?.packageNotes || "",
                allowsRequest: Boolean(x.allows_ingredient_request),
              };
              }),
            );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, params.name]);
  const back = () =>
    step === 1 ? router.back() : setStep((step - 1) as 1 | 2);
  const next = () => {
    if (!selected)
      return Alert.alert(
        "Choose a package",
        "Select Starter, Gold, or Elite before continuing.",
      );
    setStep(2);
  };
  const review = () => {
    if (!company.trim() || !contact.trim() || !brand.trim())
      return Alert.alert(
        "Complete your details",
        "Company name, contact person, and brand name are required.",
      );
    setStep(3);
  };
  const pick = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== "granted")
      return Alert.alert(
        "Permission needed",
        "Allow photo access to attach artwork.",
      );
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!r.canceled && r.assets[0]?.uri) setArtwork(r.assets[0].uri);
  };
  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const me = await getMe();
      const clientId =
        me?.business_client?.client_id ?? me?.businessClient?.client_id;
      if (!clientId)
        return Alert.alert(
          "Account notice",
          "Your business profile could not be located.",
        );
      const data = [
        "Company Name: " + company.trim(),
        "Contact Person: " + contact.trim(),
        "Brand: " + brand.trim(),
        "Finished Product: " + productName + " (" + code + ")",
        "Selected Package: " + selected.title,
        "MOQ: " + selected.moq,
        "Packaging: " + selected.packaging,
        "Label Style: " + selected.label,
        "Net Weight: " + selected.weight,
        "Lead Time: " + selected.lead,
        "Package Terms: " + selected.terms,
        artwork ? "Brand Artwork: Attached in mobile app" : null,
        selected.allowsRequest && request.trim()
          ? "Requested Ingredient / Desired Effect: " + request.trim()
          : null,
        notes.trim() ? "Special Instructions: " + notes.trim() : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const r = await submitInquiry(clientId, [
        {
          customization_type: "Package inquiry — " + selected.title,
          selected_package: selected.id,
          packaging_type: selected.packaging,
          packaging_finish: selected.label,
          serving_size: selected.weight + " × " + selected.moq,
          formulation_notes:
            "Package specification: " +
            selected.title +
            ". Internal formulation is reviewed by BMANNY Product Control.",
          requested_ingredient_note:
            selected.allowsRequest && request.trim()
              ? request.trim()
              : undefined,
          client_notes: data,
        },
      ]);
      const id = r?.inquiry?.inquiry_id ?? null;
      if (artwork && id) await uploadInquiryDesign(id, artwork);
      setInquiryId(id);
      setSuccess(true);
    } catch (e: any) {
      Alert.alert(
        "Submission error",
        e?.message || "Unable to submit your inquiry.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            s.header,
            { backgroundColor: surface, borderBottomColor: border },
          ]}
        >
          <TouchableOpacity
            style={[s.back, { backgroundColor: muted }]}
            onPress={back}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[s.headerTitle, { color: colors.text }]}>
              Product Inquiry
            </Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Step {step}:{" "}
              {step === 1
                ? "Choose a package"
                : step === 2
                  ? "Brand & business details"
                  : "Review & submit"}
            </Text>
          </View>
        </View>
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={{ color: colors.textSecondary }}>
              Loading product details…
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {!isAshigo ? (
              <View
                style={[
                  s.notice,
                  { backgroundColor: surface, borderColor: border },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="#2196F3"
                />
                <View style={s.grow}>
                  <Text style={[s.noticeTitle, { color: colors.text }]}>
                    Packages are being prepared
                  </Text>
                  <Text style={[s.noticeText, { color: colors.textSecondary }]}>
                    The new package inquiry flow is configured for AshigoPlus
                    Coffee Drink Mix only.
                  </Text>
                </View>
              </View>
            ) : step === 1 ? (
              <View>
                <Text style={[s.title, { color: colors.text }]}>
                  Choose your package
                </Text>
                <Text style={[s.lead, { color: colors.textSecondary }]}>
                  Choose the production package that fits your brand. Formula
                  and raw-material details remain private to BMANNY Product
                  Control.
                </Text>
                <View
                  style={[
                    s.product,
                    { backgroundColor: surface, borderColor: border },
                  ]}
                >
                  <Image
                    source={
                      isAshigo
                        ? ASHIGO_PRODUCT_IMAGE
                        : image
                          ? { uri: image }
                          : ASHIGO_PRODUCT_IMAGE
                    }
                    style={s.productImg}
                  />
                  <View style={s.grow}>
                    <Text style={[s.productName, { color: colors.text }]}>
                      {productName}
                    </Text>
                    <Text style={s.code}>{code}</Text>
                    <Text style={[s.info, { color: colors.textSecondary }]}>
                      Purple corn coffee blend with premium herbal ingredients.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.ingredientsToggle}
                  onPress={() => setShowIngredients(!showIngredients)}
                >
                  <Text style={s.ingredientsToggleText}>
                    {showIngredients
                      ? "Hide public ingredients"
                      : "View public ingredients"}
                  </Text>
                  <Ionicons
                    name={showIngredients ? "chevron-up" : "chevron-down"}
                    size={15}
                    color="#2196F3"
                  />
                </TouchableOpacity>
                {showIngredients && isAshigo ? (
                  <View
                    style={[
                      s.ingredientsCard,
                      { backgroundColor: muted, borderColor: border },
                    ]}
                  >
                    <View style={s.ingredientsHeader}>
                      <Ionicons name="leaf-outline" size={18} color="#2196F3" />
                      <Text style={[s.ingredientsTitle, { color: colors.text }]}>
                        Public label ingredients
                      </Text>
                    </View>
                    <Text
                      style={[s.ingredientsText, { color: colors.textSecondary }]}
                    >
                      {ASHIGO_PUBLIC_INGREDIENTS}
                    </Text>
                    <Text
                      style={[s.ingredientsNote, { color: colors.textSecondary }]}
                    >
                      Ingredient quantities and the internal formula are reviewed
                      only by BMANNY Product Control.
                    </Text>
                  </View>
                ) : null}
                {PACKAGES.map((p) => {
                  const active = p.id === tier;
                  return (
                    <View
                      key={p.id}
                      style={[
                        s.pack,
                        {
                          backgroundColor: active
                            ? isDarkMode
                              ? "#123557"
                              : "#edf7ff"
                            : surface,
                          borderColor: active ? "#2196F3" : border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={s.packSelectArea}
                        activeOpacity={0.82}
                        onPress={() => setTier(p.id)}
                      >
                      <View style={s.packMain}>
                        <Image
                          source={PACKAGE_PREVIEWS[p.id]}
                          style={s.packagePreview}
                        />
                        <View style={s.grow}>
                          <View style={s.row}>
                            <View
                              style={[
                                s.icon,
                                { backgroundColor: active ? "#2196F3" : muted },
                              ]}
                            >
                              <Ionicons
                                name={
                                  p.id === "starter"
                                    ? "rocket-outline"
                                    : p.id === "gold"
                                      ? "ribbon-outline"
                                      : "sparkles-outline"
                                }
                                size={21}
                                color={active ? "#fff" : "#2196F3"}
                              />
                            </View>
                            <View style={s.grow}>
                              <Text
                                style={[s.packTitle, { color: colors.text }]}
                              >
                                {p.title}
                              </Text>
                              <Text
                                style={[
                                  s.desc,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {p.desc}
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                active ? "checkmark-circle" : "ellipse-outline"
                              }
                              size={24}
                              color={active ? "#2196F3" : colors.textSecondary}
                            />
                          </View>
                          <View style={[s.line, { backgroundColor: border }]} />
                          <Text
                            style={[s.facts, { color: colors.textSecondary }]}
                          >
                            {p.moq} · {p.weight} · {p.label}
                          </Text>
                          <Text style={s.cost}>{p.cost}</Text>
                        </View>
                      </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.breakdownLink, { borderTopColor: border }]}
                        onPress={() => setBreakdownPackage(p)}
                      >
                        <Text style={s.breakdownLinkText}>View package breakdown</Text>
                        <Ionicons name="document-text-outline" size={16} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <Button label="Continue" onPress={next} />
              </View>
            ) : step === 2 && selected ? (
              <View>
                <Text style={[s.title, { color: colors.text }]}>
                  Tell us about your brand
                </Text>
                <Text style={[s.lead, { color: colors.textSecondary }]}>
                  These details help Sales prepare your package quotation.
                </Text>
                <Summary
                  item={selected}
                  colors={colors}
                  surface={surface}
                  border={border}
                />
                <Field
                  label="Company name *"
                  value={company}
                  change={setCompany}
                  colors={colors}
                />
                <Field
                  label="Contact person *"
                  value={contact}
                  change={setContact}
                  colors={colors}
                />
                <Field
                  label="Brand name *"
                  value={brand}
                  change={setBrand}
                  colors={colors}
                />
                <Text style={[s.label, { color: colors.text }]}>
                  Brand logo / artwork (optional)
                </Text>
                <TouchableOpacity
                  style={[
                    s.art,
                    { backgroundColor: muted, borderColor: border },
                  ]}
                  onPress={pick}
                >
                  {artwork ? (
                    <Image source={{ uri: artwork }} style={s.artImg} />
                  ) : (
                    <>
                      <Ionicons
                        name="image-outline"
                        size={29}
                        color="#2196F3"
                      />
                      <Text style={s.artTitle}>
                        Attach brand logo or label artwork
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 12 }}
                      >
                        Optional — Sales will review your file.
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {selected.allowsRequest ? (
                  <Field
                    label="Requested ingredient or desired effect (optional)"
                    value={request}
                    change={setRequest}
                    colors={colors}
                    multi
                    placeholder="Example: Please consider cinnamon extract to help reduce bitterness."
                  />
                ) : null}
                <Field
                  label="Special instructions (optional)"
                  value={notes}
                  change={setNotes}
                  colors={colors}
                  multi
                  placeholder="Share packaging, label, or delivery requirements."
                />
                <Actions
                  back={back}
                  next={review}
                  label="Review inquiry"
                  border={border}
                  text={colors.text}
                />
              </View>
            ) : step === 3 && selected ? (
              <View>
                <Text style={[s.title, { color: colors.text }]}>
                  Review your inquiry
                </Text>
                <Text style={[s.lead, { color: colors.textSecondary }]}>
                  Sales and Product Control will review your request before a
                  quotation is issued.
                </Text>
                <Summary
                  item={selected}
                  colors={colors}
                  surface={surface}
                  border={border}
                />
                <Review
                  label="Company"
                  value={company}
                  colors={colors}
                  surface={surface}
                  border={border}
                />
                <Review
                  label="Contact person"
                  value={contact}
                  colors={colors}
                  surface={surface}
                  border={border}
                />
                <Review
                  label="Brand"
                  value={brand}
                  colors={colors}
                  surface={surface}
                  border={border}
                />
                {selected.allowsRequest && request.trim() ? (
                  <Review
                    label="Ingredient request"
                    value={request}
                    colors={colors}
                    surface={surface}
                    border={border}
                  />
                ) : null}
                {notes.trim() ? (
                  <Review
                    label="Special instructions"
                    value={notes}
                    colors={colors}
                    surface={surface}
                    border={border}
                  />
                ) : null}
                <View
                  style={[
                    s.conf,
                    { backgroundColor: muted, borderColor: border },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={21}
                    color="#2196F3"
                  />
                  <Text style={[s.confText, { color: colors.textSecondary }]}>
                    BMANNY’s formulation and raw-material details are reviewed
                    internally and are not shared in this inquiry.
                  </Text>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.secondary, { borderColor: border }]}
                    onPress={back}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={submitting}
                    style={[s.primary, s.grow, submitting && { opacity: 0.7 }]}
                    onPress={submit}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.primaryText}>Submit inquiry</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}
        <Modal
          visible={Boolean(breakdownPackage)}
          transparent
          animationType="slide"
          onRequestClose={() => setBreakdownPackage(null)}
        >
          <View style={s.sheetOverlay}>
            <View style={[s.breakdownSheet, { backgroundColor: surface }]}>
              <View style={s.sheetHandle} />
              {breakdownPackage ? (
                <>
                  <View style={s.sheetHeader}>
                    <View style={s.grow}>
                      <Text style={[s.sheetEyebrow, { color: "#2196F3" }]}>ASHIGOPLUS PACKAGE</Text>
                      <Text style={[s.sheetTitle, { color: colors.text }]}>{breakdownPackage.title}</Text>
                      <Text style={[s.sheetSubtitle, { color: colors.textSecondary }]}>Package details and initial payment breakdown</Text>
                    </View>
                    <TouchableOpacity
                      accessibilityLabel="Close package breakdown"
                      style={[s.sheetClose, { borderColor: border }]}
                      onPress={() => setBreakdownPackage(null)}
                    >
                      <Ionicons name="close" size={21} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={s.sheetContent} showsVerticalScrollIndicator={false}>
                    <Image source={PACKAGE_PREVIEWS[breakdownPackage.id]} style={s.breakdownImage} />
                    <View style={[s.breakdownCard, { backgroundColor: muted, borderColor: border }]}>
                      <Text style={[s.breakdownSectionTitle, { color: colors.text }]}>Package specification</Text>
                      <Text style={[s.breakdownText, { color: colors.textSecondary }]}>{breakdownPackage.moq} · {breakdownPackage.packaging}</Text>
                      <Text style={[s.breakdownText, { color: colors.textSecondary }]}>{breakdownPackage.label} · {breakdownPackage.weight}</Text>
                      <Text style={[s.breakdownText, { color: colors.textSecondary }]}>Lead time: {breakdownPackage.lead}</Text>
                    </View>
                    <View style={[s.breakdownCard, { backgroundColor: muted, borderColor: border }]}>
                      <Text style={[s.breakdownSectionTitle, { color: colors.text }]}>Public ingredients</Text>
                      <Text style={[s.breakdownText, { color: colors.textSecondary }]}>{breakdownPackage.publicIngredients}</Text>
                    </View>
                    <View style={[s.breakdownCard, { backgroundColor: muted, borderColor: border }]}>
                      <Text style={[s.breakdownSectionTitle, { color: colors.text }]}>Package cost breakdown</Text>
                      {breakdownPackage.costBreakdown.map((line) => (
                        <View key={line.label} style={s.costLine}>
                          <View style={s.grow}>
                            <Text style={[s.costLineLabel, { color: colors.text }]}>{line.label}</Text>
                            <Text style={[s.costLineQuantity, { color: colors.textSecondary }]}>{line.quantity}</Text>
                          </View>
                          <Text style={s.costLineAmount}>{peso(line.amount)}</Text>
                        </View>
                      ))}
                      <View style={[s.costTotal, { borderTopColor: border }]}>
                        <Text style={[s.costTotalLabel, { color: colors.text }]}>Total package amount</Text>
                        <Text style={s.costTotalAmount}>{peso(breakdownPackage.initialPrice)}</Text>
                      </View>
                    </View>
                    <View style={[s.balanceCard, { borderColor: "#2196F3" }]}>
                      <Text style={[s.balanceLabel, { color: colors.text }]}>Payment terms</Text>
                      <View style={s.paymentMilestone}>
                        <Text style={[s.costLineLabel, { color: colors.text }]}>Before production (50%)</Text>
                        <Text style={s.balanceAmount}>{peso(breakdownPackage.initialPrice / 2)}</Text>
                      </View>
                      <View style={[s.paymentMilestone, { borderTopColor: border }]}>
                        <Text style={[s.costLineLabel, { color: colors.text }]}>Before pickup (50%)</Text>
                        <Text style={s.balanceAmount}>{peso(breakdownPackage.initialPrice / 2)}</Text>
                      </View>
                    </View>
                    <Text style={[s.packageNote, { color: colors.textSecondary }]}>{breakdownPackage.packageNotes}</Text>
                  </ScrollView>
                  <TouchableOpacity style={s.primary} onPress={() => setBreakdownPackage(null)}>
                    <Text style={s.primaryText}>Close breakdown</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </Modal>
        <Modal visible={success} transparent animationType="fade">
          <View style={s.overlay}>
            <View
              style={[
                s.success,
                { backgroundColor: surface, borderColor: border },
              ]}
            >
              <View style={s.successIcon}>
                <Ionicons name="checkmark" size={34} color="#fff" />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>
                Inquiry submitted
              </Text>
              <Text style={[s.successText, { color: colors.textSecondary }]}>
                Your package and brand requirements were sent to Sales for
                Product Control review.
              </Text>
              {inquiryId ? (
                <Text style={[s.ref, { color: colors.text }]}>
                  Inquiry reference #{inquiryId}
                </Text>
              ) : null}
              <Button
                label="Track my inquiries"
                onPress={() => {
                  setSuccess(false);
                  router.push("/orders");
                }}
              />
              <TouchableOpacity
                style={s.link}
                onPress={() => {
                  setSuccess(false);
                  router.push("/home");
                }}
              >
                <Text style={s.linkText}>Back to home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.primary} onPress={onPress}>
      <Text style={s.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}
function Summary({
  item,
  colors,
  surface,
  border,
}: {
  item: Pack;
  colors: any;
  surface: string;
  border: string;
}) {
  return (
    <View
      style={[s.summary, { backgroundColor: surface, borderColor: border }]}
    >
      <Text style={[s.packTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[s.summaryText, { color: colors.textSecondary }]}>
        {item.moq} · {item.weight}
      </Text>
      <Text style={[s.summaryText, { color: colors.textSecondary }]}>
        {item.packaging}
      </Text>
      <Text style={[s.summaryText, { color: colors.textSecondary }]}>
        {item.label} · {item.lead}
      </Text>
      <Text style={s.cost}>{item.cost}</Text>
    </View>
  );
}
function Field({
  label,
  value,
  change,
  colors,
  multi = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  change: (x: string) => void;
  colors: any;
  multi?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={change}
        multiline={multi}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          s.input,
          multi && s.area,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}
function Review({
  label,
  value,
  colors,
  surface,
  border,
}: {
  label: string;
  value: string;
  colors: any;
  surface: string;
  border: string;
}) {
  return (
    <View style={[s.review, { backgroundColor: surface, borderColor: border }]}>
      <Text style={[s.reviewLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[s.reviewValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}
function Actions({
  back,
  next,
  label,
  border,
  text,
}: {
  back: () => void;
  next: () => void;
  label: string;
  border: string;
  text: string;
}) {
  return (
    <View style={s.actions}>
      <TouchableOpacity
        style={[s.secondary, { borderColor: border }]}
        onPress={back}
      >
        <Text style={{ color: text, fontWeight: "700" }}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.primary, s.grow]} onPress={next}>
        <Text style={s.primaryText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1 },
  grow: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 19, fontWeight: "800" },
  sub: { fontSize: 12.5, marginTop: 2 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  content: { padding: 18, paddingBottom: 44 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800" },
  lead: { fontSize: 14.5, lineHeight: 21, marginTop: 6, marginBottom: 19 },
  notice: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  noticeTitle: { fontSize: 16, fontWeight: "800" },
  noticeText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  product: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 12,
    marginBottom: 16,
  },
  productImg: { width: 72, height: 72, borderRadius: 11, resizeMode: "cover" },
  imgFallback: { alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 16, fontWeight: "800" },
  code: { fontSize: 12, color: "#2196F3", fontWeight: "700", marginTop: 2 },
  info: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  ingredientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: -6,
    marginBottom: 12,
    paddingVertical: 5,
  },
  ingredientsToggleText: { color: "#2196F3", fontSize: 13, fontWeight: "800" },
  ingredientsCard: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    marginBottom: 14,
  },
  ingredientsHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  ingredientsTitle: { fontSize: 14, fontWeight: "800" },
  ingredientsText: { fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  ingredientsNote: { fontSize: 11.5, fontStyle: "italic", lineHeight: 17, marginTop: 9 },
  pack: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 12 },
  packSelectArea: { borderRadius: 12 },
  packMain: { flexDirection: "row", gap: 13 },
  packagePreview: {
    width: 92,
    height: 128,
    borderRadius: 11,
    backgroundColor: "#f7f2e9",
    // Preserve the entire supplied package reference instead of cropping its edges.
    resizeMode: "contain",
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  icon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  packTitle: { fontSize: 17, fontWeight: "800" },
  desc: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  line: { height: 1, marginVertical: 13 },
  facts: { fontSize: 11.5, lineHeight: 18 },
  cost: { color: "#2196F3", fontSize: 14, fontWeight: "800", marginTop: 10 },
  breakdownLink: {
    minHeight: 42,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  breakdownLinkText: { color: "#2196F3", fontSize: 13, fontWeight: "800" },
  primary: {
    backgroundColor: "#2196F3",
    minHeight: 52,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  summary: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 20 },
  summaryText: { fontSize: 12.5, lineHeight: 20 },
  field: { marginBottom: 15 },
  label: { fontSize: 13.5, fontWeight: "700", marginBottom: 7 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  art: {
    minHeight: 118,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    marginBottom: 16,
  },
  artImg: { width: 94, height: 94, borderRadius: 10 },
  artTitle: { color: "#2196F3", fontSize: 14, fontWeight: "800", marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  secondary: {
    minHeight: 51,
    minWidth: 86,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  review: { borderWidth: 1, borderRadius: 13, padding: 14, marginBottom: 10 },
  reviewLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  reviewValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
    lineHeight: 21,
  },
  conf: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  confText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3,10,24,.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(3,10,24,.7)",
    justifyContent: "flex-end",
  },
  breakdownSheet: {
    maxHeight: "91%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#7083a1",
    alignSelf: "center",
    marginBottom: 15,
  },
  sheetHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  sheetEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  sheetTitle: { fontSize: 23, fontWeight: "800", marginTop: 4 },
  sheetSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  sheetClose: {
    width: 43,
    height: 43,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { paddingTop: 17, paddingBottom: 8 },
  breakdownImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: "#f7f2e9",
    resizeMode: "contain",
    marginBottom: 13,
  },
  breakdownCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 11 },
  breakdownSectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 7 },
  breakdownText: { fontSize: 13, lineHeight: 20 },
  costLine: { flexDirection: "row", gap: 10, paddingVertical: 9 },
  costLineLabel: { fontSize: 13.5, fontWeight: "700" },
  costLineQuantity: { fontSize: 11.5, marginTop: 2 },
  costLineAmount: { color: "#2196F3", fontSize: 14, fontWeight: "800" },
  costTotal: {
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  costTotalLabel: { fontSize: 13, fontWeight: "800", flex: 1 },
  costTotalAmount: { color: "#2196F3", fontSize: 16, fontWeight: "800" },
  balanceCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 13 },
  balanceLabel: { fontSize: 14, fontWeight: "800" },
  balanceAmount: { color: "#2196F3", fontSize: 23, fontWeight: "800", marginTop: 4 },
  paymentMilestone: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  balanceNote: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  packageNote: { fontSize: 12, lineHeight: 18, paddingHorizontal: 3, marginBottom: 8 },
  success: {
    width: "100%",
    maxWidth: 390,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    padding: 23,
  },
  successIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: { fontSize: 23, fontWeight: "800" },
  successText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },
  ref: { fontSize: 13.5, fontWeight: "800", marginTop: 14 },
  link: { paddingVertical: 15 },
  linkText: { color: "#2196F3", fontSize: 14, fontWeight: "700" },
});
