import getEncapsulatedImageFrame from './getEncapsulatedImageFrame.js';
import getUncompressedImageFrame from './getUncompressedImageFrame.js';

function getPixelData(dicomDict, frameIndex = 0) {
  const pixelDataElement =
    dicomDict.dict['7FE00010'] || dicomDict.dict['7FE00008'];

  if (!pixelDataElement) {
    return null;
  }

  const isEncapsulated = pixelDataElement.Meta.length === 0xffffffff; // 4294967295

  if (isEncapsulated) {
    return getEncapsulatedImageFrame(dicomDict, frameIndex);
  }

  return getUncompressedImageFrame(dicomDict, frameIndex);
}

export default getPixelData;
