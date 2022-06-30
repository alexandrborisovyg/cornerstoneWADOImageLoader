export default function getEncapsulatedImageFrame(dicomDict, frameIndex) {
  const pixelDataElement =
    dicomDict.dict['7FE00010'] || dicomDict.dict['7FE00008'];

  return pixelDataElement.Value[frameIndex];
}
