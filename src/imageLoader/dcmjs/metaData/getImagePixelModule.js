import { getValue } from './utils.js';

function getLutDescriptor(dicomDict, tag) {
  if (tag && tag[0] === 'x') {
    tag = tag.substring(1);
  }

  if (!dicomDict.dict[tag] || dicomDict.dict[tag].length !== 6) {
    return;
  }

  return [
    getValue(dicomDict, tag, 0),
    getValue(dicomDict, tag, 1),
    getValue(dicomDict, tag, 2),
  ];
}

function getLutData(lutDicomDict, tag, lutDescriptor) {
  if (tag && tag[0] === 'x') {
    tag = tag.substring(1);
  }

  const lut = [];
  const lutData = lutDicomDict[tag];

  for (let i = 0; i < lutDescriptor[0]; i++) {
    // Output range is always unsigned
    if (lutDescriptor[2] === 16) {
      lut[i] = getValue(lutDicomDict, tag, i);
    } else {
      lut[i] = new Uint8Array(lutData)[i]; // TODO CHECK
    }
  }

  return lut;
}

function populatePaletteColorLut(dicomDict, imagePixelModule) {
  imagePixelModule.redPaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    'x00281101'
  );
  imagePixelModule.greenPaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    'x00281102'
  );
  imagePixelModule.bluePaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    'x00281103'
  );

  // The first Palette Color Lookup Table Descriptor value is the number of entries in the lookup table.
  // When the number of table entries is equal to 2ˆ16 then this value shall be 0.
  // See http://dicom.nema.org/MEDICAL/DICOM/current/output/chtml/part03/sect_C.7.6.3.html#sect_C.7.6.3.1.5
  if (imagePixelModule.redPaletteColorLookupTableDescriptor[0] === 0) {
    imagePixelModule.redPaletteColorLookupTableDescriptor[0] = 65536;
    imagePixelModule.greenPaletteColorLookupTableDescriptor[0] = 65536;
    imagePixelModule.bluePaletteColorLookupTableDescriptor[0] = 65536;
  }

  // The third Palette Color Lookup Table Descriptor value specifies the number of bits for each entry in the Lookup Table Data.
  // It shall take the value of 8 or 16.
  // The LUT Data shall be stored in a format equivalent to 8 bits allocated when the number of bits for each entry is 8, and 16 bits allocated when the number of bits for each entry is 16, where in both cases the high bit is equal to bits allocated-1.
  // The third value shall be identical for each of the Red, Green and Blue Palette Color Lookup Table Descriptors.
  //
  // Note: Some implementations have encoded 8 bit entries with 16 bits allocated, padding the high bits;
  // this can be detected by comparing the number of entries specified in the LUT Descriptor with the actual value length of the LUT Data entry.
  // The value length in bytes should equal the number of entries if bits allocated is 8, and be twice as long if bits allocated is 16.
  const numLutEntries =
    imagePixelModule.redPaletteColorLookupTableDescriptor[0];
  const lutData = dicomDict.dict['00281201'];
  const lutBitsAllocated = lutData.length === numLutEntries ? 8 : 16;

  // If the descriptors do not appear to have the correct values, correct them
  if (
    imagePixelModule.redPaletteColorLookupTableDescriptor[2] !==
    lutBitsAllocated
  ) {
    imagePixelModule.redPaletteColorLookupTableDescriptor[2] = lutBitsAllocated;
    imagePixelModule.greenPaletteColorLookupTableDescriptor[2] =
      lutBitsAllocated;
    imagePixelModule.bluePaletteColorLookupTableDescriptor[2] =
      lutBitsAllocated;
  }

  imagePixelModule.redPaletteColorLookupTableData = getLutData(
    dicomDict,
    'x00281201',
    imagePixelModule.redPaletteColorLookupTableDescriptor
  );
  imagePixelModule.greenPaletteColorLookupTableData = getLutData(
    dicomDict,
    'x00281202',
    imagePixelModule.greenPaletteColorLookupTableDescriptor
  );
  imagePixelModule.bluePaletteColorLookupTableData = getLutData(
    dicomDict,
    'x00281203',
    imagePixelModule.bluePaletteColorLookupTableDescriptor
  );
}

function populateSmallestLargestPixelValues(dicomDict, imagePixelModule) {
  const pixelRepresentation = getValue(dicomDict, 'x00280103');

  if (pixelRepresentation === 0) {
    imagePixelModule.smallestPixelValue = getValue(dicomDict, 'x00280106');
    imagePixelModule.largestPixelValue = getValue(dicomDict, 'x00280107');
  } else {
    imagePixelModule.smallestPixelValue = getValue(dicomDict, 'x00280106');
    imagePixelModule.largestPixelValue = getValue(dicomDict, 'x00280107');
  }
}

function getImagePixelModule(dicomDict) {
  const imagePixelModule = {
    samplesPerPixel: getValue(dicomDict, 'x00280002'),
    photometricInterpretation: getValue(dicomDict, 'x00280004'),
    rows: getValue(dicomDict, 'x00280010'),
    columns: getValue(dicomDict, 'x00280011'),
    bitsAllocated: getValue(dicomDict, 'x00280100'),
    bitsStored: getValue(dicomDict, 'x00280101'),
    highBit: getValue(dicomDict, 'x00280102'),
    pixelRepresentation: getValue(dicomDict, 'x00280103'),
    planarConfiguration: getValue(dicomDict, 'x00280006'),
    pixelAspectRatio: getValue(dicomDict, 'x00280034'),
  };

  populateSmallestLargestPixelValues(dicomDict, imagePixelModule);

  if (
    imagePixelModule.photometricInterpretation === 'PALETTE COLOR' &&
    dicomDict.dict['00281101']
  ) {
    populatePaletteColorLut(dicomDict, imagePixelModule);
  }

  return imagePixelModule;
}

export default getImagePixelModule;
