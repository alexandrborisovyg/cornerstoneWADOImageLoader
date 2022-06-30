import parseImageId from '../parseImageId.js';
import dataSetCacheManager from '../dataSetCacheManager.js';
import getImagePixelModule from './getImagePixelModule.js';
import getOverlayPlaneModule from './getOverlayPlaneModule.js';
import getLUTs from './getLUTs.js';
import getModalityLUTOutputPixelRepresentation from './getModalityLUTOutputPixelRepresentation.js';
import { getValue, parseDA, parseTM, getNumberValues } from './utils.js';

function metaDataProvider(type, imageId) {
  const parsedImageId = parseImageId(imageId);

  const dicomDict = dataSetCacheManager.get(parsedImageId.url);

  if (!dicomDict) {
    // TODO consider async/await pattern here?
    console.warn(`${parsedImageId.url} has not loaded yet.`);

    return;
  }

  // TODO each module is defined by the dicom spec and should
  // probably be scraped to fully encompass all possible metadata
  // https://dicom.innolitics.com/
  if (type === 'generalSeriesModule') {
    return {
      modality: getValue(dicomDict, '00080060')[0],
      seriesInstanceUID: getValue(dicomDict, '0020000e')[0],
      seriesNumber: getValue(dicomDict, '00200011')[0],
      studyInstanceUID: getValue(dicomDict, '0020000d')[0],
      seriesDate: parseDA(getValue(dicomDict, '00080021')[0]),
      seriesTime: parseTM(getValue(dicomDict, '00080031')[0] || ''),
    };
  }

  if (type === 'patientStudyModule') {
    return {
      patientAge: getValue(dicomDict, '00101010')[0],
      patientSize: getValue(dicomDict, '00101020')[0],
      patientWeight: getValue(dicomDict, '00101030')[0],
    };
  }

  if (type === 'imagePlaneModule') {
    const imageOrientationPatient = getNumberValues(dicomDict, '00200037')[6];
    const imagePositionPatient = getNumberValues(dicomDict, '00200032')[3];
    const pixelSpacing = getNumberValues(dicomDict, '00280030')[2];

    let columnPixelSpacing = null;

    let rowPixelSpacing = null;

    if (pixelSpacing) {
      rowPixelSpacing = pixelSpacing[0];
      columnPixelSpacing = pixelSpacing[1];
    }

    let rowCosines = null;

    let columnCosines = null;

    if (imageOrientationPatient) {
      rowCosines = [
        parseFloat(imageOrientationPatient[0]),
        parseFloat(imageOrientationPatient[1]),
        parseFloat(imageOrientationPatient[2]),
      ];
      columnCosines = [
        parseFloat(imageOrientationPatient[3]),
        parseFloat(imageOrientationPatient[4]),
        parseFloat(imageOrientationPatient[5]),
      ];
    }

    return {
      frameOfReferenceUID: getValue(dicomDict, '00200052')[0],
      rows: getValue(dicomDict, '00280010')[0],
      columns: getValue(dicomDict, '00280011')[0],
      imageOrientationPatient,
      rowCosines,
      columnCosines,
      imagePositionPatient,
      sliceThickness: getValue(dicomDict, '00180050')[0],
      sliceLocation: getValue(dicomDict, '00201041')[0],
      pixelSpacing,
      rowPixelSpacing,
      columnPixelSpacing,
    };
  }

  if (type === 'imagePixelModule') {
    return getImagePixelModule(dicomDict);
  }

  if (type === 'modalityLutModule') {
    return {
      rescaleIntercept: getValue(dicomDict, '00281052')[0],
      rescaleSlope: getValue(dicomDict, '00281053')[0],
      rescaleType: getValue(dicomDict, '00281054')[0],
      modalityLUTSequence: getLUTs(
        getValue(dicomDict, '00280103')[0],
        getValue(dicomDict, '00283000')
      ),
    };
  }

  if (type === 'voiLutModule') {
    const modalityLUTOutputPixelRepresentation =
      getModalityLUTOutputPixelRepresentation(dicomDict);

    return {
      windowCenter: getNumberValues(dicomDict, '00281050')[1],
      windowWidth: getNumberValues(dicomDict, '00281051')[1],
      voiLUTSequence: getLUTs(
        modalityLUTOutputPixelRepresentation,
        getValue(dicomDict, '00283010')
      ),
    };
  }

  if (type === 'sopCommonModule') {
    return {
      sopClassUID: getValue(dicomDict, '00080016')[0],
      sopInstanceUID: getValue(dicomDict, '00080018')[0],
    };
  }

  if (type === 'petIsotopeModule') {
    const radiopharmaceuticalInfo = getValue(dicomDict, '00540016');

    if (radiopharmaceuticalInfo === undefined) {
      return;
    }

    const firstRadiopharmaceuticalInfoDataSet = radiopharmaceuticalInfo[0];

    return {
      radiopharmaceuticalInfo: {
        radiopharmaceuticalStartTime: parseTM(
          getValue(firstRadiopharmaceuticalInfoDataSet, '00181072')[0] || ''
        ),
        radionuclideTotalDose: getValue(
          firstRadiopharmaceuticalInfoDataSet,
          '00181074'
        )[0],
        radionuclideHalfLife: getValue(
          firstRadiopharmaceuticalInfoDataSet,
          '00181075'
        )[0],
      },
    };
  }

  if (type === 'overlayPlaneModule') {
    return getOverlayPlaneModule(dicomDict);
  }
}

export default metaDataProvider;
