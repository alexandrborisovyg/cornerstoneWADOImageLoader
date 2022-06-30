import unpackBinaryFrame from './unpackBinaryFrame.js';
import { getValue } from './metaData/utils.js';
/**
 * Function to deal with extracting an image frame from an encapsulated data set.
 */

function getUncompressedImageFrame(dicomDict, frameIndex) {
  const pixelDataElement =
    dicomDict.dict['7FE00010'] || dicomDict.dict['7FE00008'];

  const pixelArrayBuffer = pixelDataElement.Value[0];
  const bitsAllocated = getValue(dicomDict, '00280100')[0];
  const rows = getValue(dicomDict, '00280010')[0];
  const columns = getValue(dicomDict, '00280011')[0];

  let samplesPerPixel = getValue(dicomDict, '00280002')[0];

  /**
   * From: http://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.3.html
   *
   * Though the chrominance channels are downsampled, there are still nominally
   * three channels, hence Samples per Pixel (0028,0002) has a value of 3, not
   * 2. I.e., for pixel data in a Native (uncompressed) format, the Value Length
   * of Pixel Data (7FE0,0010) is not:
   *
   * Rows (0028,0010) * Columns (0028,0011) * Number of Frames (0028,0008) *
   * Samples per Pixel (0028,0002) * (⌊(Bits Allocated (0028,0100)-1)/8⌋+1)
   *
   * padded to an even length, as it would otherwise be, but rather is:
   *
   * Rows (0028,0010) * Columns (0028,0011) * Number of Frames (0028,0008) * 2 *
   * (⌊(Bits Allocated (0028,0100)-1)/8⌋+1)
   *
   * padded to an even length.
   */
  const photometricInterpretation = getValue(dicomDict, '00280004')[0];

  if (photometricInterpretation === 'YBR_FULL_422') {
    samplesPerPixel = 2;
    console.warn(
      `Using SamplesPerPixel of 2 for YBR_FULL_422 photometric interpretation.
      See http://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.3.html for more information.`
    );
  }

  const pixelDataOffset = 0;
  const pixelsPerFrame = rows * columns * samplesPerPixel;

  let frameOffset;

  if (bitsAllocated === 8) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame;
    if (frameOffset >= pixelArrayBuffer.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(
      pixelArrayBuffer.slice(frameOffset, frameOffset + pixelsPerFrame)
    );
  } else if (bitsAllocated === 16) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 2;
    if (frameOffset >= pixelArrayBuffer.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(
      pixelArrayBuffer.slice(frameOffset, frameOffset + pixelsPerFrame * 2)
    );
  } else if (bitsAllocated === 1) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 0.125;
    if (frameOffset >= pixelArrayBuffer.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return unpackBinaryFrame(pixelArrayBuffer, frameOffset, pixelsPerFrame);
  } else if (bitsAllocated === 32) {
    frameOffset = pixelDataOffset + frameIndex * pixelsPerFrame * 4;
    if (frameOffset >= pixelArrayBuffer.length) {
      throw new Error('frame exceeds size of pixelData');
    }

    return new Uint8Array(
      pixelArrayBuffer.slice(frameOffset, frameOffset + pixelsPerFrame * 4)
    );
  }

  throw new Error('unsupported pixel format');
}

export default getUncompressedImageFrame;
