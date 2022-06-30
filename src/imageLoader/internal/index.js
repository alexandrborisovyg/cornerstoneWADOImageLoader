import { default as xhrRequest } from './xhrRequest.js';
import { default as FetchRequest } from './fetchRequest.js';
import { setOptions, getOptions } from './options.js';

const internal = {
  xhrRequest,
  FetchRequest,
  setOptions,
  getOptions,
};

export { setOptions, getOptions, xhrRequest, FetchRequest, internal };
