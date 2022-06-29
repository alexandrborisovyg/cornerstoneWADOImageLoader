/* eslint no-bitwise: 0 */
import { getValue } from './utils.js';

function getMinStoredPixelValue(dicomDict) {
  const pixelRepresentation = getValue(dicomDict, 'x00280103');
  const bitsStored = getValue(dicomDict, 'x00280101');

  if (pixelRepresentation === 0) {
    return 0;
  }

  return -1 << (bitsStored - 1);
}

// 0 = unsigned / US, 1 = signed / SS
function getModalityLUTOutputPixelRepresentation(dicomDict) {
  // CT SOP Classes are always signed
  const sopClassUID = getValue(dicomDict, 'x00080016');

  if (
    sopClassUID === '1.2.840.10008.5.1.4.1.1.2' ||
    sopClassUID === '1.2.840.10008.5.1.4.1.1.2.1'
  ) {
    return 1;
  }

  // if rescale intercept and rescale slope are present, pass the minimum stored
  // pixel value through them to see if we get a signed output range
  const rescaleIntercept = getValue(dicomDict, 'x00281052');
  const rescaleSlope = getValue(dicomDict, 'x00281053');

  if (rescaleIntercept !== undefined && rescaleSlope !== undefined) {
    const minStoredPixelValue = getMinStoredPixelValue(dicomDict); //
    const minModalityLutValue =
      minStoredPixelValue * rescaleSlope + rescaleIntercept;

    if (minModalityLutValue < 0) {
      return 1;
    }

    return 0;
  }

  // Output of non linear modality lut is always unsigned
  if (dicomDict.dict['00283000'] && dicomDict.dict['00283000'].length > 0) {
    return 0;
  }

  // If no modality lut transform, output is same as pixel representation
  return getValue(dicomDict, 'x00280103');
}

export default getModalityLUTOutputPixelRepresentation;
