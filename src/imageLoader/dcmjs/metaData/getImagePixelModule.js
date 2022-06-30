import { getValue } from './utils.js';

function getLutDescriptor(dicomDict, tag) {
  const data = getValue(dicomDict, tag);

  if (!data || data.length !== 6) {
    return;
  }

  return [data[0], data[1], data[2]];
}

function getLutData(dicomDict, tag, lutDescriptor) {
  const lutData = getValue(dicomDict, tag);

  if (lutDescriptor[2] === 16) {
    return lutData;
  }

  debugger; // TODO check
  const lut = [];

  for (let i = 0; i < lutDescriptor[0]; i++) {
    lut[i] = new Uint8Array(lutData)[i];
  }

  return lut;
}

function populatePaletteColorLut(dicomDict, imagePixelModule) {
  imagePixelModule.redPaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    '00281101'
  );
  imagePixelModule.greenPaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    '00281102'
  );
  imagePixelModule.bluePaletteColorLookupTableDescriptor = getLutDescriptor(
    dicomDict,
    '00281103'
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
  const lutData = getValue(dicomDict, '00281201');
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
    '00281201',
    imagePixelModule.redPaletteColorLookupTableDescriptor
  );
  imagePixelModule.greenPaletteColorLookupTableData = getLutData(
    dicomDict,
    '00281202',
    imagePixelModule.greenPaletteColorLookupTableDescriptor
  );
  imagePixelModule.bluePaletteColorLookupTableData = getLutData(
    dicomDict,
    '00281203',
    imagePixelModule.bluePaletteColorLookupTableDescriptor
  );
}

function populateSmallestLargestPixelValues(dicomDict, imagePixelModule) {
  const pixelRepresentation = getValue(dicomDict, '00280103')[0];

  if (pixelRepresentation === 0) {
    imagePixelModule.smallestPixelValue = getValue(dicomDict, '00280106')[0];
    imagePixelModule.largestPixelValue = getValue(dicomDict, '00280107')[0];
  } else {
    imagePixelModule.smallestPixelValue = getValue(dicomDict, '00280106')[0];
    imagePixelModule.largestPixelValue = getValue(dicomDict, '00280107')[0];
  }
}

function getImagePixelModule(dicomDict) {
  const imagePixelModule = {
    samplesPerPixel: getValue(dicomDict, '00280002')[0],
    photometricInterpretation: getValue(dicomDict, '00280004')[0],
    rows: getValue(dicomDict, '00280010')[0],
    columns: getValue(dicomDict, '00280011')[0],
    bitsAllocated: getValue(dicomDict, '00280100')[0],
    bitsStored: getValue(dicomDict, '00280101')[0],
    highBit: getValue(dicomDict, '00280102')[0],
    pixelRepresentation: getValue(dicomDict, '00280103')[0],
    planarConfiguration: getValue(dicomDict, '00280006')[0],
    pixelAspectRatio: getValue(dicomDict, '00280034')[0],
  };

  populateSmallestLargestPixelValues(dicomDict, imagePixelModule);

  if (
    imagePixelModule.photometricInterpretation === 'PALETTE COLOR' &&
    getValue(dicomDict, '00281101')
  ) {
    populatePaletteColorLut(dicomDict, imagePixelModule);
  }

  return imagePixelModule;
}

export default getImagePixelModule;
