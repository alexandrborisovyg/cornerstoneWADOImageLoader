import {
  getImagePixelModule,
  getLUTs,
  getModalityLUTOutputPixelRepresentation,
  getNumberValues,
  metaDataProvider,
} from './metaData/index.js';

import dataSetCacheManager from './dataSetCacheManager.js';
import getEncapsulatedImageFrame from './getEncapsulatedImageFrame.js';
import getUncompressedImageFrame from './getUncompressedImageFrame.js';
import { loadImage } from './loadImage.js';
import parseImageId from './parseImageId.js';
import unpackBinaryFrame from './unpackBinaryFrame.js';
import register from './register.js';

const metaData = {
  getImagePixelModule,
  getLUTs,
  getModalityLUTOutputPixelRepresentation,
  getNumberValues,
  metaDataProvider,
};

export default {
  metaData,
  dataSetCacheManager,
  getEncapsulatedImageFrame,
  getUncompressedImageFrame,
  loadImage,
  parseImageId,
  unpackBinaryFrame,
  register,
};
