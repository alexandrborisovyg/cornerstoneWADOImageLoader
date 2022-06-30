import createImage from '../createImage.js';
import parseImageId from './parseImageId.js';
import dataSetCacheManager from './dataSetCacheManager.js';
import getPixelData from './getPixelData.js';
import { getValue } from './metaData/utils.js';

// add a decache callback function to clear out our dataSetCacheManager
function addDecache(imageLoadObject, imageId) {
  imageLoadObject.decache = function () {
    const parsedImageId = parseImageId(imageId);

    dataSetCacheManager.unload(parsedImageId.url);
  };
}

async function _loadImage(imageId, options = {}, addDecache) {
  try {
    const parsedImageId = parseImageId(imageId);

    options = Object.assign({}, options);

    // if the dataset for this url is already loaded, use it
    const start = new Date().getTime();
    const dicomDict = await dataSetCacheManager.load(
      parsedImageId.url,
      imageId
    );
    const pixelData = getPixelData(dicomDict, parsedImageId.frame);
    const transferSyntax = getValue(dicomDict, '00020010');
    const loadEnd = new Date().getTime();

    addDecache();
    const image = await createImage(
      imageId,
      pixelData,
      transferSyntax,
      options
    );

    image.data = dicomDict; // not really used by image, but okay to add for debugging;
    image.sharedCacheKey = parsedImageId.url;
    const end = new Date().getTime();

    image.loadTimeInMS = loadEnd - start;
    image.totalTimeInMS = end - start;

    return image;
  } catch (err) {
    return {
      err,
      imageId,
    };
  }
}

function loadImage(imageId, options = {}) {
  const imageLoadObject = {
    promise: _loadImage(imageId, options, () => {
      addDecache(imageLoadObject, imageId);
    }),
    cancelFn: undefined,
  };

  return imageLoadObject;
}

export { loadImage };
