import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { problemFor } from "@/data/problem";
import { createRequest } from "@/data/requests";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { pickIdPhoto, type IdPhoto } from "@/lib/pick-id-photo";

type NewRequestModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const validContact = (s: string) =>
  /^[+\d][\d\s()-]*$/.test(s) && s.replace(/\D/g, "").length >= 7;

export function NewRequestModal({
  visible,
  onClose,
  onCreated,
}: NewRequestModalProps) {
  const theme = useTheme();
  const profile = useProfile();
  const [hostName, setHostName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [contact, setContact] = useState(profile.contact ?? "");
  const [idPhoto, setIdPhoto] = useState<IdPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  const valid =
    hostName.trim() !== "" &&
    unitNo.trim() !== "" &&
    purpose.trim() !== "" &&
    validContact(contact.trim()) &&
    idPhoto !== null;

  function close() {
    setHostName("");
    setUnitNo("");
    setPurpose("");
    setContact(profile.contact ?? "");
    setIdPhoto(null);
    setProblem("");
    setSaving(false);
    onClose();
  }

  async function choosePhoto(source: "camera" | "library") {
    setProblem("");
    try {
      const photo = await pickIdPhoto(source);
      if (photo) setIdPhoto(photo);
    } catch (e) {
      setProblem(
        e instanceof Error && e.message === "camera-denied"
          ? "Allow camera access in your phone settings to take a photo."
          : "Could not open the photo. Try again.",
      );
    }
  }

  function save() {
    if (!idPhoto) return;
    setSaving(true);
    setProblem("");
    createRequest({
      hostName: hostName.trim(),
      unitNo: unitNo.trim(),
      purpose: purpose.trim(),
      contact: contact.trim(),
      idImage: idPhoto,
    })
      .then(() => {
        close();
        onCreated();
      })
      .catch((e) => {
        setProblem(
          problemFor(
            e,
            "We could not find a tenant with that name and unit. Check the details and try again.",
          ),
        );
        setSaving(false);
      });
  }

  const input = {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 16,
    color: theme.text,
    borderColor: theme.textSecondary,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: Spacing.four,
            borderTopRightRadius: Spacing.four,
            maxHeight: "90%",
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: Spacing.four,
              gap: Spacing.three,
            }}
          >
            <ThemedText type="subtitle">Request a gatepass</ThemedText>

            <View style={{ gap: Spacing.one }}>
              <ThemedText type="small">Tenant&apos;s full name</ThemedText>
              <TextInput
                value={hostName}
                onChangeText={setHostName}
                placeholder="e.g. Juan Dela Cruz"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                editable={!saving}
                style={input}
              />
            </View>

            <View style={{ gap: Spacing.one }}>
              <ThemedText type="small">
                Tenant&apos;s unit or room number
              </ThemedText>
              <TextInput
                value={unitNo}
                onChangeText={setUnitNo}
                placeholder="e.g. 1204"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                editable={!saving}
                style={input}
              />
            </View>

            <View style={{ gap: Spacing.one }}>
              <ThemedText type="small">Purpose of visit</ThemedText>
              <TextInput
                value={purpose}
                onChangeText={setPurpose}
                placeholder="Why are you visiting?"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!saving}
                style={[input, { minHeight: 90 }]}
              />
            </View>

            <View style={{ gap: Spacing.one }}>
              <ThemedText type="small">Your contact number</ThemedText>
              <TextInput
                value={contact}
                onChangeText={setContact}
                placeholder="e.g. 0917 123 4567"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!saving}
                style={input}
              />
            </View>

            <View style={{ gap: Spacing.two }}>
              <ThemedText type="small">Photo of your ID</ThemedText>
              {idPhoto ? (
                <Image
                  source={{ uri: idPhoto.uri }}
                  contentFit="cover"
                  accessibilityLabel="Photo of your ID"
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: Spacing.two,
                  }}
                />
              ) : (
                <View
                  style={{
                    height: 120,
                    borderRadius: Spacing.two,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: theme.textSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: Spacing.one,
                  }}
                >
                  <Ionicons
                    name="card-outline"
                    size={32}
                    color={theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    No photo yet
                  </ThemedText>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: Spacing.three }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={idPhoto ? "Retake" : "Take photo"}
                    variant="outline"
                    onPress={() => choosePhoto("camera")}
                    disabled={saving}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={idPhoto ? "Choose another" : "Upload photo"}
                    variant="outline"
                    onPress={() => choosePhoto("library")}
                    disabled={saving}
                  />
                </View>
              </View>
            </View>

            {problem !== "" && (
              <ThemedText type="small" style={{ color: "#d64545" }}>
                {problem}
              </ThemedText>
            )}

            <View style={{ flexDirection: "row", gap: Spacing.three }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={close}
                  disabled={saving}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Send request"
                  onPress={save}
                  disabled={!valid}
                  loading={saving}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
