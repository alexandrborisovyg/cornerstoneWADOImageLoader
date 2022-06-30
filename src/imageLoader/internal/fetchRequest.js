import external from '../../externalModules.js';
import { getOptions } from './options.js';

class FetchRequest {
  constructor(
    url,
    imageId,
    defaultHeaders = {},
    params = {},
    onSize = {},
    onParsed = {}
  ) {
    this.url = url;
    this.imageId = imageId;
    this.defaultHeaders = defaultHeaders;
    this.params = params;
    this.cacheCount = 1;
    this.dicomDict = this.fetchDicomDict();
    this.onSize = onSize;
    this.onParsed = onParsed;
  }

  async fetchDicomDict() {
    const { cornerstone, dcmjs } = external;
    const options = getOptions();

    const errorInterceptor = (err) => {
      if (typeof options.errorInterceptor === 'function') {
        options.errorInterceptor(err);
        throw new Error(err);
      }
    };

    const beforeSendHeaders = await options.beforeSend(
      this.url,
      this.imageId,
      this.defaultHeaders,
      this.params
    );

    try {
      const response = await fetch(this.url, {
        headers: Object.assign({}, this.defaultHeaders, beforeSendHeaders),
      });

      if (!response.ok) {
        return errorInterceptor(response.json());
      }

      const headers = response.headers;
      const size = parseInt(headers.get('content-length'), 10);

      debugger;

      this.onSize(size);
      this.size = size;
      this.arrayBuffer = new ArrayBuffer(size);
      const reader = response.body.getReader();

      this.reader = reader;

      let offset = 0;

      for (;;) {
        if (options.onloadstart) {
          await options.onloadstart(this.params);
        }
        // Event
        cornerstone.triggerEvent(
          cornerstone.events,
          'cornerstoneimageloadstart',
          {
            url: this.url,
            imageId: this.imageId,
          }
        );

        const { done, value } = await reader.read();
        const int8 = new Uint8Array(this.arrayBuffer);

        debugger;

        int8.set(value, offset);
        offset += value.length;

        const percentComplete = Math.round((offset / size) * 100);

        // Action
        if (options.onprogress) {
          await options.onprogress(this.params);
        }

        // Event
        cornerstone.triggerEvent(
          cornerstone.events,
          cornerstone.EVENTS.IMAGE_LOAD_PROGRESS,
          {
            url: this.url,
            imageId: this.imageId,
            offset,
            size,
            percentComplete,
          }
        );
        if (done) {
          // Action
          if (options.onloadend) {
            await options.onloadend(this.params);
          }

          // Event
          cornerstone.triggerEvent(
            cornerstone.events,
            'cornerstoneimageloadend',
            {
              url: this.url,
              imageId: this.imageId,
            }
          );

          await options.beforeProcessing();

          const dicomDict = dcmjs.data.DicomMessage.readFile(this.arrayBuffer);

          this.onParsed();

          return dicomDict;
        }
      }
    } catch (err) {
      return errorInterceptor(err);
    }
  }

  cancel() {
    if (this.reader) {
      this.reader.cancel();
    }
  }
}

export default FetchRequest;
