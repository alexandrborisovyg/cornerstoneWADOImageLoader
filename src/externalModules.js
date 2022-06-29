/* eslint import/extensions:0 */
import registerLoaders from './imageLoader/registerLoaders.js';

let cornerstone;

let dicomParser;

let dcmjs;

const external = {
  set cornerstone(cs) {
    cornerstone = cs;

    registerLoaders(cornerstone);
  },
  get cornerstone() {
    if (!cornerstone) {
      if (window && window.cornerstone) {
        cornerstone = window.cornerstone;

        registerLoaders(cornerstone);
      } else {
        throw new Error(
          'cornerstoneWADOImageLoader requires a copy of Cornerstone to work properly. Please add cornerstoneWADOImageLoader.external.cornerstone = cornerstone; to your application.'
        );
      }
    }

    return cornerstone;
  },
  set dicomParser(dp) {
    dicomParser = dp;
  },
  get dicomParser() {
    if (!dicomParser) {
      if (window && window.dicomParser) {
        dicomParser = window.dicomParser;
      } else {
        throw new Error(
          'cornerstoneWADOImageLoader requires a copy of dicomParser to work properly. Please add cornerstoneWADOImageLoader.external.dicomParser = dicomParser; to your application.'
        );
      }
    }

    return dicomParser;
  },

  set dcmjs(d) {
    dcmjs = d;
  },

  get dcmjs() {
    if (!dcmjs) {
      if (window && window.dcmjs) {
        dcmjs = window.dcmjs;
      } else {
        throw new Error(
          'cornerstoneWADOImageLoader requires a copy of dcmjs to work properly. Please add cornerstoneWADOImageLoader.external.dcmjs = dcmjs; to your application.'
        );
      }
    }

    return dcmjs;
  },
};

export default external;
