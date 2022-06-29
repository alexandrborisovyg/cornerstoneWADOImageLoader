import { getValue } from './utils.js';

function getLUT(pixelRepresentation, lutDicomDict) {
  let numLUTEntries = getValue(lutDicomDict, 'x00283002', 0);

  if (numLUTEntries === 0) {
    numLUTEntries = 65535;
  }
  let firstValueMapped = 0;

  if (pixelRepresentation === 0) {
    firstValueMapped = getValue(lutDicomDict, 'x00283002', 1);
  } else {
    firstValueMapped = getValue(lutDicomDict, 'x00283002', 1);
  }
  const numBitsPerEntry = getValue(lutDicomDict, 'x00283002', 2);
  // console.log('LUT(', numLUTEntries, ',', firstValueMapped, ',', numBitsPerEntry, ')');
  const lut = {
    id: '1',
    firstValueMapped,
    numBitsPerEntry,
    lut: [],
  };

  // console.log("minValue=", minValue, "; maxValue=", maxValue);
  for (let i = 0; i < numLUTEntries; i++) {
    if (pixelRepresentation === 0) {
      lut.lut[i] = getValue(lutDicomDict, 'x00283006', i);
    } else {
      lut.lut[i] = getValue(lutDicomDict, 'x00283006', i);
    }
  }

  return lut;
}

function getLUTs(pixelRepresentation, lutSequence) {
  if (!lutSequence || !lutSequence.items.length) {
    return;
  }
  const luts = [];

  for (let i = 0; i < lutSequence.length; i++) {
    const lutDicomDict = lutSequence[i];
    const lut = getLUT(pixelRepresentation, lutDicomDict);

    if (lut) {
      luts.push(lut);
    }
  }

  return luts;
}

export default getLUTs;
