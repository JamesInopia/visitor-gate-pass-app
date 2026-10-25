import * as ImagePicker from "expo-image-picker";

export type IdPhoto = { uri: string; name: string; type: string };

export async function pickIdPhoto(
  source: "camera" | "library",
): Promise<IdPhoto | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("camera-denied");
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.7,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `id-${Date.now()}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
  };
}
