import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const MAX_SIZE_BYTES = 512 * 1024; // 512KB
const MAX_DIMENSION = 1024;
const MAX_INPUT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — reject before attempting compression

export async function compressImage(uri: string): Promise<string> {
  // PERF-6: Check file size BEFORE compression to prevent OOM on huge files
  const inputInfo = await FileSystem.getInfoAsync(uri);
  // AI-5: Reject empty/0-byte files
  if (!inputInfo.exists || !inputInfo.size || inputInfo.size === 0) {
    throw new Error('EMPTY_FILE');
  }
  if (inputInfo.size > MAX_INPUT_SIZE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  // GDPR-5: Resize strips EXIF metadata (GPS, camera info) from output JPEG.
  // expo-image-manipulator's manipulateAsync does NOT preserve EXIF in output.
  // This is critical: food photos with GPS should NOT be sent to Claude API.
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
      result.uri,
      [{ resize: { width: 768 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
  }

  // Read as base64 (EXIF-free JPEG)
  const base64 = await FileSystem.readAsStringAsync(result.uri, {
    encoding: 'base64' as const,
  });

  return base64;
}
