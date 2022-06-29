function getValue(dicomDict, tag, index) {
  if (tag && tag[0] === 'x') {
    tag = tag.substring(1);
  }

  const elements = dicomDict.dict;
  const element = elements[tag];

  index = index === undefined ? 0 : index;
  if (element && element.length !== 0) {
    return element[index];
  }

  return undefined;
}

// algorithm based on http://stackoverflow.com/questions/1433030/validate-number-of-days-in-a-given-month
function daysInMonth(m, y) {
  // m is 0 indexed: 0-11
  switch (m) {
    case 2:
      return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
    case 9:
    case 4:
    case 6:
    case 11:
      return 30;
    default:
      return 31;
  }
}

function isValidDate(d, m, y) {
  // make year is a number
  if (isNaN(y)) {
    return false;
  }

  return m > 0 && m <= 12 && d > 0 && d <= daysInMonth(m, y);
}

/**
 * Parses a DA formatted string into a Javascript object
 * @param {string} date a string in the DA VR format
 * @param {boolean} [validate] - true if an exception should be thrown if the date is invalid
 * @returns {*} Javascript object with properties year, month and day or undefined if not present or not 8 bytes long
 */
function parseDA(date, validate) {
  if (date && date.length === 8) {
    const yyyy = parseInt(date.substring(0, 4), 10);

    const mm = parseInt(date.substring(4, 6), 10);

    const dd = parseInt(date.substring(6, 8), 10);

    if (validate) {
      if (isValidDate(dd, mm, yyyy) !== true) {
        throw Error(`invalid DA '${date}'`);
      }
    }

    return {
      year: yyyy,
      month: mm,
      day: dd,
    };
  }
  if (validate) {
    throw Error(`invalid DA '${date}'`);
  }

  return undefined;
}

/**
 * Parses a TM formatted string into a javascript object with properties for hours, minutes, seconds and fractionalSeconds
 * @param {string} time - a string in the TM VR format
 * @param {boolean} [validate] - true if an exception should be thrown if the date is invalid
 * @returns {*} javascript object with properties for hours, minutes, seconds and fractionalSeconds or undefined if no element or data.  Missing fields are set to undefined
 */

// eslint-disable-next-line complexity
function parseTM(time, validate) {
  if (time.length >= 2) {
    // must at least have HH
    // 0123456789
    // HHMMSS.FFFFFF
    const hh = parseInt(time.substring(0, 2), 10);
    const mm =
      time.length >= 4 ? parseInt(time.substring(2, 4), 10) : undefined;
    const ss =
      time.length >= 6 ? parseInt(time.substring(4, 6), 10) : undefined;

    const fractionalStr = time.length >= 8 ? time.substring(7, 13) : undefined;
    const ffffff = fractionalStr
      ? parseInt(fractionalStr, 10) * Math.pow(10, 6 - fractionalStr.length)
      : undefined;

    if (validate) {
      if (
        isNaN(hh) ||
        (mm !== undefined && isNaN(mm)) ||
        (ss !== undefined && isNaN(ss)) ||
        (ffffff !== undefined && isNaN(ffffff)) ||
        hh < 0 ||
        hh > 23 ||
        (mm && (mm < 0 || mm > 59)) ||
        (ss && (ss < 0 || ss > 59)) ||
        (ffffff && (ffffff < 0 || ffffff > 999999))
      ) {
        throw Error(`invalid TM '${time}'`);
      }
    }

    return {
      hours: hh,
      minutes: mm,
      seconds: ss,
      fractionalSeconds: ffffff,
    };
  }

  if (validate) {
    throw Error(`invalid TM '${time}'`);
  }

  return undefined;
}

function getNumberValues(dicomDict, tag, minimumLength) {
  const values = [];
  const valueAsString = getValue(dicomDict, tag);

  if (!valueAsString) {
    return;
  }
  const split = valueAsString.split('\\');

  if (minimumLength && split.length < minimumLength) {
    return;
  }
  for (let i = 0; i < split.length; i++) {
    values.push(parseFloat(split[i]));
  }

  return values;
}

export { getValue, getNumberValues, parseDA, parseTM };
