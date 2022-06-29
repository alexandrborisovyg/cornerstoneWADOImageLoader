import { getValue } from './utils.js';

export default function getOverlayPlaneModule(dicomDict) {
  const overlays = [];

  for (let overlayGroup = 0x00; overlayGroup <= 0x1e; overlayGroup += 0x02) {
    let groupStr = `60${overlayGroup.toString(16)}`;

    if (groupStr.length === 4) {
      groupStr = `600${overlayGroup.toString(16)}`;
    }

    const data = dicomDict.dict[`${groupStr}3000`];

    if (!data) {
      continue;
    }

    const pixelData = [];

    for (let i = 0; i < data.length; i++) {
      for (let k = 0; k < 8; k++) {
        const byte_as_int = new Uint8Array(data)[i]; // TODO CHECK

        pixelData[i * 8 + k] = (byte_as_int >> k) & 0b1; // eslint-disable-line no-bitwise
      }
    }

    overlays.push({
      rows: getValue(dicomDict, `${groupStr}0010`),
      columns: getValue(dicomDict, `${groupStr}0011`),
      type: getValue(dicomDict, `${groupStr}0040`),
      x: getValue(dicomDict, `${groupStr}0050`, 1) - 1,
      y: getValue(dicomDict, `${groupStr}0050`, 0) - 1,
      pixelData,
      description: getValue(dicomDict, `${groupStr}0022`),
      label: getValue(dicomDict, `${groupStr}1500`),
      roiArea: getValue(dicomDict, `${groupStr}1301`),
      roiMean: getValue(dicomDict, `${groupStr}1302`),
      roiStandardDeviation: getValue(dicomDict, `${groupStr}1303`),
    });
  }

  return {
    overlays,
  };
}
