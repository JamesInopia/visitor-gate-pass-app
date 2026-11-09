import { StyleSheet, View } from "react-native";

import { GatepassQr } from "@/components/gatepass-qr";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { GatepassRequest } from "@/data/requests";
import { describe, formatDateTime, visitDateOf } from "@/lib/gatepass-time";
import { formatVisitDate } from "@/lib/visit-date";

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

export function GatepassDetails({ request }: { request: GatepassRequest }) {
  const d = describe(request);

  return (
    <>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.hostName}>
          {request.hostName}
        </ThemedText>
        <StatusBadge phase={d.phase} label={d.badge} />
      </View>
      <ThemedText themeColor="textSecondary">{d.detail}</ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        {request.unitNo ? (
          <Field label="Unit / Room" value={request.unitNo} />
        ) : null}
        <Field
          label="Date of visit"
          value={formatVisitDate(visitDateOf(request))}
        />
        <Field label="Purpose of visit" value={request.purpose} />
        <Field label="Requested" value={formatDateTime(request.requestedAt)} />
        {request.respondedAt ? (
          <Field
            label={
              request.status === "denied"
                ? "Denied"
                : request.status === "cancelled"
                  ? "Cancelled"
                  : "Approved"
            }
            value={formatDateTime(request.respondedAt)}
          />
        ) : null}
      </ThemedView>

      {request.pass && d.phase !== "expired" && (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Gatepass</ThemedText>
          <GatepassQr code={request.pass.code} />
          <View style={{ gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Code (show this at the entrance)
            </ThemedText>
            <ThemedText type="code" selectable style={styles.code}>
              {request.pass.code}
            </ThemedText>
          </View>
          <Field label="Valid on" value={d.schedule} />
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  hostName: { flex: 1, fontSize: 28, lineHeight: 36 },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  code: { fontSize: 24, lineHeight: 32, letterSpacing: 2 },
});
