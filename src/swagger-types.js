// src/swagger-types.js

/**
 * Wspólne typy dla express-jsdoc-swagger
 * (plik jest tylko po to, żeby swagger mógł zassać typedefy z JSDoc)
 */
/**
 * @typedef {object} ResizeConfig
 * @property {string} outputResize.required - np. "1000x200"
 * @property {string} fit - enum:cover,contain,fill,inside,outside
 * @property {string} position - enum:top,right top,right,right bottom,bottom,left bottom,left,left top,center
 * @property {string} background - np. "rgb(255,255,255)"
 * @property {string} kernel - enum:nearest,cubic,mitchell,lanczos2,lanczos3
 * @property {boolean} withoutEnlargement
 * @property {boolean} withoutReduction
 * @property {boolean} fastShrinkOnLoad
 * @property {string} addName - np. "1000x200"
 */

/**
 * @typedef {object} AvifConfig
 * @property {integer} quality
 * @property {boolean} lossless
 * @property {integer} effort
 * @property {string} chromaSubsampling - np. "4:4:4"
 */

/**
 * @typedef {object} WebpConfig
 * @property {integer} quality
 * @property {integer} alphaQuality
 * @property {boolean} lossless
 * @property {boolean} nearLossless
 * @property {boolean} smartSubsample
 * @property {string} preset - enum:default,photo,picture,drawing,icon,text
 * @property {integer} effort
 * @property {integer} loop
 * @property {integer} delay
 * @property {boolean} minSize
 * @property {boolean} mixed
 * @property {boolean} force
 */

/**
 * @typedef {object} JpgConfig
 * @property {integer} quality
 * @property {boolean} progressive
 * @property {string} chromaSubsampling - np. "4:4:4"
 * @property {boolean} optimiseCoding
 * @property {boolean} mozjpeg
 * @property {boolean} trellisQuantisation
 * @property {boolean} overshootDeringing
 * @property {boolean} optimiseScans
 * @property {integer} quantisationTable
 * @property {boolean} force
 */

/**
 * @typedef {object} OutputFormat
 * @property {AvifConfig} avif
 * @property {WebpConfig} webp
 * @property {JpgConfig} jpg
 */

/**
 * @typedef {object} ImageProcessingBody
 * @property {string} loaderTyp.required - enum:local,mount,url
 * @property {string} imagePath.required
 * @property {array<ResizeConfig>} outputResize
 * @property {OutputFormat} outputFormat
 * @property {string} outputStorage.required - enum:local,mount,stream,cr2,ftp
 */

/**
 * Query dla /one (pojedyncze przetworzenie) – zgodnie z tym jak budujesz createImageProcessingRequest()
 * @typedef {object} ImageProcessingQuery
 * @property {string} [loaderTyp] - local|mount|url
 * @property {string} imagePath.required
 * @property {string} [outputStorage] - local|mount|stream|cr2|ftp
 *
 * @property {string} [outputResize] - np. "1000x200"
 * @property {string} [fit]
 * @property {string} [position]
 * @property {string} [background]
 * @property {string} [kernel]
 * @property {boolean} [withoutEnlargement]
 * @property {boolean} [withoutReduction]
 * @property {boolean} [fastShrinkOnLoad]
 * @property {string} [addName]
 *
 * @property {string} [outputFormat] - avif|webp|jpg
 *
 * @property {number} [quality]
 * @property {boolean} [lossless]
 * @property {number} [effort]
 * @property {string} [chromaSubsampling]
 *
 * @property {number} [alphaQuality]
 * @property {boolean} [nearLossless]
 * @property {boolean} [smartSubsample]
 * @property {string} [preset]
 * @property {number} [loop]
 * @property {number} [delay]
 * @property {boolean} [minSize]
 * @property {boolean} [mixed]
 * @property {boolean} [force]
 *
 * @property {boolean} [progressive]
 * @property {boolean} [optimiseCoding]
 * @property {boolean} [mozjpeg]
 * @property {boolean} [trellisQuantisation]
 * @property {boolean} [overshootDeringing]
 * @property {boolean} [optimiseScans]
 * @property {number} [quantisationTable]
 */

/**
 * @typedef {object} ApiOk
 * @property {null} error
 * @property {string} message
 */

/**
 * @typedef {object} ApiError
 * @property {string} error
 * @property {string} message
 */

export {};
