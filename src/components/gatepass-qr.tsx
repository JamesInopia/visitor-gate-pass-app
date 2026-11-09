import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export function GatepassQr({
  code,
  size = 220,
}: {
  code: string;
  size?: number;
}) {
  return (
    <View
      style={styles.frame}
      accessibilityLabel={`QR code for gatepass ${code}`}
    >
      <QRCode
        value={code}
        size={size}
        color="#000000"
        backgroundColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
  },
});
