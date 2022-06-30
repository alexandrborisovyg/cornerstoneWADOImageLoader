/* eslint no-bitwise: 0 */
import { getValue } from './utils.js';

function getMinStoredPixelValue(dicomDict) {
  const pixelRepresentation = getValue(dicomDict, '00280103')[0];
  const bitsStored = getValue(dicomDict, '00280101')[0];

  if (pixelRepresentation === 0) {
    return 0;
  }

  return -1 << (bitsStored - 1);
}

// 0 = unsigned / US, 1 = signed / SS
function getModalityLUTOutputPixelRepresentation(dicomDict) {
  // CT SOP Classes are always signed
  const sopClassUID = getValue(dicomDict, '00080016')[0];

  if (
    sopClassUID === '1.2.840.10008.5.1.4.1.1.2' ||
    sopClassUID === '1.2.840.10008.5.1.4.1.1.2.1'
  ) {
    return 1;
  }

  // if rescale intercept and rescale slope are present, pass the minimum stored
  // pixel value through them to see if we get a signed output range
  const rescaleIntercept = getValue(dicomDict, '00281052')[0];
  const rescaleSlope = getValue(dicomDict, '00281053')[0];

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
  if (getValue(dicomDict, '00283000')) {
    return 0;
  }

  // If no modality lut transform, output is same as pixel representation
  return getValue(dicomDict, '00280103')[0];
}

export default getModalityLUTOutputPixelRepresentation;
