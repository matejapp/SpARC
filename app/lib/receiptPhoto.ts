import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// A phone camera's photo is far bigger than OCR needs: a 48 MP iPhone photo is over the API's
// 10 MB cap (the upload is cut off mid-way) and over the reader's 40 MP cap. The reader works at
// 1600–3200 px on the long side, so the photo is shrunk to that before it leaves the phone:
// about 1 MB, and a faster upload. expo-image-manipulator runs in Expo Go on both platforms.

const LONG_SIDE = 2800;
const JPEG_QUALITY = 0.8;

/**
 * The photo at `uri` (`width` × `height`, as the camera reported it), as an upright JPEG of at
 * most LONG_SIDE px on its longer side. The result is a new file in the app's cache, like the
 * original; neither goes to the camera roll.
 */
export async function shrinkForUpload(uri: string, width: number, height: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    if (Math.max(width, height) > LONG_SIDE) {
      context.resize(width >= height ? { width: LONG_SIDE } : { height: LONG_SIDE });
    }
    const image = await context.renderAsync();
    try {
      const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
      return saved.uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}
