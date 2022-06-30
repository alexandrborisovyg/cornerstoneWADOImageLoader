import { getValue } from './utils.js';

function getLUT(pixelRepresentation, lutDicomDict) {
  let numLUTEntries = getValue(lutDicomDict, '00283002')[0];

  if (numLUTEntries === 0) {
    numLUTEntries = 65535;
  }
  let firstValueMapped = 0;

  if (pixelRepresentation === 0) {
    firstValueMapped = getValue(lutDicomDict, '00283002')[1];
  } else {
    debugger;
    firstValueMapped = getValue(lutDicomDict, '00283002')[1];
  }
  const numBitsPerEntry = getValue(lutDicomDict, '00283002')[2];

  const lut = {
    id: '1',
    firstValueMapped,
    numBitsPerEntry,
    lut: [],
  };

  for (let i = 0; i < numLUTEntries; i++) {
    if (pixelRepresentation === 0) {
      lut.lut[i] = getValue(lutDicomDict, '00283006')[i];
    } else {
      debugger;
      lut.lut[i] = getValue(lutDicomDict, '00283006')[i];
    }
  }

  return lut;
}

function getLUTs(pixelRepresentation, lutSequence) {
  if (!lutSequence || !lutSequence.length) {
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
