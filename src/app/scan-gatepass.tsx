import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { RoleGuard } from "@/components/role-guard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { problemFor } from "@/data/problem";
import { scanGatepass, type ScanResult } from "@/data/scan";
import { useTheme } from "@/hooks/use-theme";
import { formatDateTime } from "@/lib/gatepass-time";

const GREEN = "#2e9e5b";
const RED = "#d64545";

type Phase =
  | { kind: "scanning" }
  | { kind: "checking" }
  | { kind: "result"; result: ScanResult }
  | { kind: "failed"; message: string };

function headline(r: ScanResult) {
  if (r.ok) return r.action === "enter" ? "Entry recorded" : "Exit recorded";
  switch (r.reason) {
    case "expired":
      return "Gatepass expired";
    case "not_yet":
      return "Not valid yet";
    case "revoked":
      return "Gatepass revoked";
    default:
      return "Invalid QR code";
  }
}

function explanation(r: ScanResult) {
  if (r.ok) return formatDateTime(r.at ?? new Date());
  switch (r.reason) {
    case "expired":
      return r.expiresAt ? `Expired ${formatDateTime(r.expiresAt)}` : "Expired";
    case "not_yet":
      return r.startsAt
        ? `Valid from ${formatDateTime(r.startsAt)}`
        : "It is not the visitor's scheduled time yet";
    case "revoked":
      return "This gatepass was cancelled by the building.";
    default:
      return "This code does not match any gatepass.";
  }
}

function ResultView({
  result,
  onNext,
}: {
  result: ScanResult;
  onNext: () => void;
}) {
  const color = result.ok ? GREEN : RED;
  const icon = result.ok
    ? result.action === "enter"
      ? "log-in"
      : "log-out"
    : "close-circle";

  return (
    <ScrollView contentContainerStyle={styles.resultWrap}>
      <View style={[styles.banner, { backgroundColor: color }]}>
        <Ionicons name={icon} size={64} color="#ffffff" />
        <ThemedText type="subtitle" style={styles.bannerTitle}>
          {result.ok ? "Access granted" : "Access denied"}
        </ThemedText>
        <ThemedText style={styles.bannerText}>{headline(result)}</ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText themeColor="textSecondary">
          {explanation(result)}
        </ThemedText>
        {result.visitorName ? (
          <View style={{ gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Visitor
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={{ fontSize: 20, lineHeight: 28 }}
            >
              {result.visitorName}
            </ThemedText>
          </View>
        ) : null}
        {result.hostName ? (
          <View style={{ gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Visiting
            </ThemedText>
            <ThemedText>
              {result.hostName}
              {result.unitNo ? ` · Unit ${result.unitNo}` : ""}
            </ThemedText>
          </View>
        ) : null}
        {result.purpose ? (
          <View style={{ gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Purpose of visit
            </ThemedText>
            <ThemedText>{result.purpose}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <AppButton title="Scan next" onPress={onNext} />
    </ScrollView>
  );
}

function Scanner() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [focused, setFocused] = useState(true);
  const [manual, setManual] = useState("");
  const busy = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const check = useCallback((raw: string) => {
    const code = raw.trim();
    if (!code || busy.current) return;
    busy.current = true;
    setPhase({ kind: "checking" });
    scanGatepass(code)
      .then((result) => setPhase({ kind: "result", result }))
      .catch((e) =>
        setPhase({
          kind: "failed",
          message: problemFor(e, "Scanner is not set up on the server."),
        }),
      );
  }, []);

  const next = () => {
    busy.current = false;
    setManual("");
    setPhase({ kind: "scanning" });
  };

  if (phase.kind === "checking")
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Checking gatepass</ThemedText>
      </ThemedView>
    );

  if (phase.kind === "failed")
    return (
      <ThemedView style={styles.middle}>
        <ThemedText>{phase.message}</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ textAlign: "center" }}
        >
          Nothing was recorded. Scan the pass again.
        </ThemedText>
        <AppButton title="Scan again" onPress={next} />
      </ThemedView>
    );

  if (phase.kind === "result")
    return <ResultView result={phase.result} onNext={next} />;

  if (!permission)
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );

  if (!permission.granted)
    return (
      <ThemedView style={styles.middle}>
        <ThemedText style={{ textAlign: "center" }}>
          Camera access is needed to scan gatepass QR codes.
        </ThemedText>
        <AppButton
          title={permission.canAskAgain ? "Allow camera" : "Open settings"}
          onPress={() =>
            permission.canAskAgain
              ? requestPermission()
              : Linking.openSettings()
          }
        />
      </ThemedView>
    );

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={styles.cameraWrap}>
        {focused && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => check(data)}
          />
        )}
        <View pointerEvents="none" style={styles.frame} />
      </View>

      <View style={styles.manual}>
        <ThemedText type="small" themeColor="textSecondary">
          Or type the code
        </ThemedText>
        <View style={styles.manualRow}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="XXXX-XXXX"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement },
            ]}
          />
          <AppButton
            title="Check"
            disabled={manual.trim() === ""}
            onPress={() => check(manual)}
          />
        </View>
      </View>
    </ThemedView>
  );
}

export default function ScanGatepassScreen() {
  return (
    <RoleGuard route="scan-gatepass">
      <Scanner />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 16,
  },
  manual: { padding: Spacing.three, gap: Spacing.two },
  manualRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  input: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    letterSpacing: 1,
  },
  resultWrap: { padding: Spacing.three, gap: Spacing.three },
  banner: {
    borderRadius: 12,
    padding: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },
  bannerTitle: { color: "#ffffff", fontSize: 28, lineHeight: 36 },
  bannerText: { color: "#ffffff" },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
});
