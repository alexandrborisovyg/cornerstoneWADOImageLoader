import external from '../../externalModules.js';
import { FetchRequest } from '../internal/index.js';

/**
 * This object supports loading of DICOM P10 dataset from a uri and caching it so it can be accessed
 * by the caller.  This allows a caller to access the datasets without having to go through cornerstone's
 * image loader mechanism.  One reason a caller may need to do this is to determine the number of frames
 * in a multiframe sop instance so it can create the imageId's correctly.
 */
let cacheSizeInBytes = 0;

let loadedDataSets = {};

// returns true if the wadouri for the specified index has been loaded
function isLoaded(uri) {
  return loadedDataSets[uri] !== undefined;
}

function get(uri) {
  if (!loadedDataSets[uri]) {
    return;
  }

  return loadedDataSets[uri].dicomDict;
}

// loads the dicom dataset from the wadouri sp
async function load(uri, imageId) {
  const { cornerstone } = external;

  if (loadedDataSets[uri]) {
    loadedDataSets[uri].cacheCount++;

    return loadedDataSets[uri].dicomDict;
  }

  // This uri is not loaded or being loaded, load it via an xhrRequest
  loadedDataSets[uri] = new FetchRequest(
    uri,
    imageId,
    {},
    {},
    (size) => {
      cacheSizeInBytes += size;
    },
    () => {
      cornerstone.triggerEvent(cornerstone.events, 'datasetscachechanged', {
        uri,
        action: 'loaded',
        cacheInfo: getInfo(),
      });
    }
  );

  return loadedDataSets[uri].dicomDict;
}

// remove the cached/loaded dicom dataset for the specified wadouri to free up memory
function unload(uri) {
  const { cornerstone } = external;

  if (loadedDataSets[uri]) {
    loadedDataSets[uri].cacheCount--;
    if (loadedDataSets[uri].cacheCount === 0) {
      loadedDataSets[uri].cancel();
      if (loadedDataSets[uri].size) {
        cacheSizeInBytes -= loadedDataSets[uri].size;
      }
      delete loadedDataSets[uri];

      cornerstone.triggerEvent(cornerstone.events, 'datasetscachechanged', {
        uri,
        action: 'unloaded',
        cacheInfo: getInfo(),
      });
    }
  }
}

export function getInfo() {
  return {
    cacheSizeInBytes,
    numberOfDataSetsCached: Object.keys(loadedDataSets).length,
  };
}

// removes all cached datasets from memory
function purge() {
  loadedDataSets = {};
  cacheSizeInBytes = 0;
}

export default {
  isLoaded,
  load,
  unload,
  getInfo,
  purge,
  get,
};
