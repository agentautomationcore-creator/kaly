import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const MAX_SIZE_BYTES = 512 * 1024; // 512KB
const MAX_DIMENSION = 1024;

export async function compressImage(uri: string): Promise<string> {
  // Resize to max 1024px on longest side
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Check file size
  const info = await FileSystem.getInfoAsync(result.uri);
  if (info.exists && info.size && info.size > MAX_SIZE_BYTES) {
    // Compress more aggressively
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 768 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  // Read as base64
  const base64 = await FileSystem.readAsStringAsync(result.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64;
}
