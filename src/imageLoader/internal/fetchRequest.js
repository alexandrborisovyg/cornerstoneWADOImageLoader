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
    this.onSize = onSize;
    this.onParsed = onParsed;
    this.chunks = [];
    this.options = getOptions() || {};
    this.dicomDict = this.fetchDicomDict();
  }

  static errorInterceptor(err) {
    if (typeof this.options.errorInterceptor === 'function') {
      this.options.errorInterceptor(err);
      throw new Error(err);
    }
  }

  async onloadstart() {
    const { cornerstone } = external;

    // Onload Start Event
    if (this.options.onloadstart) {
      await this.options.onloadstart(this.params);
    }
    cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadstart', {
      url: this.url,
      imageId: this.imageId,
    });
  }

  async onloadend() {
    const { cornerstone } = external;

    if (this.options.onloadend) {
      await this.options.onloadend(this.params);
    }
    cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadend', {
      url: this.url,
      imageId: this.imageId,
    });

    await this.options.beforeProcessing();
  }

  async onprogress() {
    const { cornerstone } = external;
    const percentComplete = Math.round((this.size / this.total) * 100);

    if (this.options.onprogress) {
      await this.options.onprogress(this.params);
    }
    cornerstone.triggerEvent(
      cornerstone.events,
      cornerstone.EVENTS.IMAGE_LOAD_PROGRESS,
      {
        url: this.url,
        imageId: this.imageId,
        loaded: this.size,
        total: this.total,
        percentComplete,
      }
    );
  }

  async fetchDicomDict() {
    const { dcmjs } = external;

    try {
      const beforeSendHeaders = await this.options.beforeSend(
        this.url,
        this.imageId,
        this.defaultHeaders,
        this.params
      );

      const response = await fetch(this.url, {
        headers: {
          ...this.defaultHeaders,
          ...beforeSendHeaders,
        },
      });

      if (!response.ok) {
        return this.errorInterceptor(response.json());
      }

      this.total =
        parseInt(response.headers.get('content-length'), 10) || undefined;
      this.reader = response.body.getReader();
      await this.onloadstart();
      for (;;) {
        const { done, value } = await this.reader.read();

        if (done) {
          await this.onloadend();
          const dicomDict = dcmjs.data.DicomMessage.readFile(
            FetchRequest.getArrayBuffer(this.chunks, this.size)
          );

          await this.onParsed();

          return dicomDict;
        }

        this.chunks.push(value);
        await this.onprogress();
      }
    } catch (err) {
      return this.errorInterceptor(err);
    }
  }

  get size() {
    return this.chunks.reduce((sum, curr) => sum + curr.length, 0);
  }

  static getArrayBuffer(chunks, size) {
    const result = new Uint8Array(size);

    // Build the new array
    let offset = 0;

    for (const arr of chunks) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result.buffer;
  }

  cancel() {
    if (this.reader) {
      this.reader.cancel();
    }
  }
}

export default FetchRequest;
