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
      modality: getValue(dicomDict, 'x00080060'),
      seriesInstanceUID: getValue(dicomDict, 'x0020000e'),
      seriesNumber: getValue(dicomDict, 'x00200011'),
      studyInstanceUID: getValue(dicomDict, 'x0020000d'),
      seriesDate: parseDA(getValue(dicomDict, 'x00080021')),
      seriesTime: parseTM(getValue(dicomDict, 'x00080031') || ''),
    };
  }

  if (type === 'patientStudyModule') {
    return {
      patientAge: getValue(dicomDict, 'x00101010'),
      patientSize: getValue(dicomDict, 'x00101020'),
      patientWeight: getValue(dicomDict, 'x00101030'),
    };
  }

  if (type === 'imagePlaneModule') {
    const imageOrientationPatient = getNumberValues(dicomDict, 'x00200037', 6);
    const imagePositionPatient = getNumberValues(dicomDict, 'x00200032', 3);
    const pixelSpacing = getNumberValues(dicomDict, 'x00280030', 2);

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
      frameOfReferenceUID: getValue(dicomDict, 'x00200052'),
      rows: getValue(dicomDict, 'x00280010'),
      columns: getValue(dicomDict, 'x00280011'),
      imageOrientationPatient,
      rowCosines,
      columnCosines,
      imagePositionPatient,
      sliceThickness: getValue(dicomDict, 'x00180050'),
      sliceLocation: getValue(dicomDict, 'x00201041'),
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
      rescaleIntercept: getValue(dicomDict, 'x00281052'),
      rescaleSlope: getValue(dicomDict, 'x00281053'),
      rescaleType: getValue(dicomDict, 'x00281054'),
      modalityLUTSequence: getLUTs(
        getValue(dicomDict, 'x00280103'),
        dicomDict.dict['00283000']
      ),
    };
  }

  if (type === 'voiLutModule') {
    const modalityLUTOutputPixelRepresentation =
      getModalityLUTOutputPixelRepresentation(dicomDict);

    return {
      windowCenter: getNumberValues(dicomDict, 'x00281050', 1),
      windowWidth: getNumberValues(dicomDict, 'x00281051', 1),
      voiLUTSequence: getLUTs(
        modalityLUTOutputPixelRepresentation,
        dicomDict.dict['00283010']
      ),
    };
  }

  if (type === 'sopCommonModule') {
    return {
      sopClassUID: getValue(dicomDict, 'x00080016'),
      sopInstanceUID: getValue(dicomDict, 'x00080018'),
    };
  }

  if (type === 'petIsotopeModule') {
    const radiopharmaceuticalInfo = dicomDict.dict['00540016'];

    if (radiopharmaceuticalInfo === undefined) {
      return;
    }

    const firstRadiopharmaceuticalInfoDataSet = radiopharmaceuticalInfo[0];

    return {
      radiopharmaceuticalInfo: {
        radiopharmaceuticalStartTime: parseTM(
          getValue(firstRadiopharmaceuticalInfoDataSet, 'x00181072') || ''
        ),
        radionuclideTotalDose: getValue(
          firstRadiopharmaceuticalInfoDataSet,
          'x00181074'
        ),
        radionuclideHalfLife: getValue(
          firstRadiopharmaceuticalInfoDataSet,
          'x00181075'
        ),
      },
    };
  }

  if (type === 'overlayPlaneModule') {
    return getOverlayPlaneModule(dicomDict);
  }
}

export default metaDataProvider;
