// import express from 'express';
// import sharp from "sharp";
// import color from "color";
// import {
//     parseBool,
//     createDirectory,
//     loader,
//     isValidResize,
//     pathNormalize
// } from "./tools.js";
//

//
// const router = express.Router();
//
// router.get('/', async (req, res)=>
// {
//     console.log("/multi");
//     try {
//         const loaderTyp = req.query.loaderTyp;
//         const allowedLoaderTyp = {
//             'local': true,
//             'mount': true,
//             'url': true
//         };
//         if (!allowedLoaderTyp.hasOwnProperty(loaderTyp)) return res.status(400).send('Invalid "loaderTyp" parameter');
//         const imagePath = req.query.imagePath;
//         if(!imagePath) return res.status(400).send('Invalid "imagePath" parameter');
//
//         const imageBuffer = await loader(loaderTyp, imagePath);
//         let sharpConfig = await sharp(imageBuffer);
//
//         const outputFormat = req.query.outputFormat || "jpg";
//         const allowedOutputFormat = {
//             'jpg': true,
//             'webp': true,
//             'avif': true
//         };
//         if (!allowedOutputFormat.hasOwnProperty(outputFormat)) return res.status(400).send('Invalid "outputFormat" parameter');
//
//         const outputResize = req.query.outputResize;
//         if(outputResize){
//             const dimensionsResize = isValidResize(outputResize);
//             if (!dimensionsResize) return res.status(400).json({ error: "Invalid resize format. Should be [int]x[int] e.g. 100x100" });
//             const { width, height } = dimensionsResize;
//             if (dimensionsResize) {
//             try{
//                 const fit =  req.query.fit || 'contain';
//                 const allowedFits = {
//                     cover: true,
//                     contain: true,
//                     fill: true,
//                     inside: true,
//                     outside: true
//                 };
//                 const position =  req.query.position || 'center';
//                 const allowedPositions = {
//                     'top': true,
//                     'right top': true,
//                     'right': true,
//                     'right bottom': true,
//                     'bottom': true,
//                     'left bottom': true,
//                     'left': true,
//                     'left top': true,
//                     'center': true
//                 };
//                 const background =  req.query.background || 'rgb(255,255,255)'; // rgb(255,255,255) => white, rgb(255,0,0) => red, rgb(255,255,0)=>yellow, rgb(0,0,255) => blue
//                 const kernel =  req.query.kernel || 'lanczos3';
//                 const allowedKernels = {
//                     'nearest': true,
//                     'cubic': true,
//                     'mitchell': true,
//                     'lanczos2': true,
//                     'lanczos3': true
//                 };
//                 const withoutEnlargement = req.query.withoutEnlargement ? parseBool(req.query.withoutEnlargement) : false;
//                 const withoutReduction = req.query.withoutReduction ? parseBool(req.query.withoutReduction) : false;
//                 const fastShrinkOnLoad = req.query.fastShrinkOnLoad ? parseBool(req.query.fastShrinkOnLoad) : true;
//
//
//                 if (!allowedFits.hasOwnProperty(fit)) return res.status(400).send('Invalid "fit" parameter');
//                 if (!allowedPositions.hasOwnProperty(position))  return res.status(400).send('Invalid "position" parameter');
//                 if (!/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(background)) return res.status(400).send('Invalid "background" parameter');
//                 if (!allowedKernels.hasOwnProperty(kernel)) return res.status(400).send('Invalid "kernel" parameter');
//
//                 sharpConfig = await sharpConfig.resize(width, height ,{
//                     fit: fit,
//                     position: position,
//                     background: color(background),
//                     kernel: kernel,
//                     withoutEnlargement: withoutEnlargement,
//                     withoutReduction: withoutReduction,
//                     fastShrinkOnLoad: fastShrinkOnLoad
//                 });
//                 console.log("Resize ... ");
//             } catch (error) {
//                 console.error("Resize Error: ", error);
//                 throw new Error(`Resize Error: ${error.message}`);
//             }
//         }
//         }
//         let quality;
//         let chromaSubsampling;
//         let force;
//         let effort;
//         let lossless;
//         switch (outputFormat) {
//             case "webp":
//                 console.log(`Output format: ${outputFormat} ... `);
//                 quality = req.query.quality ? parseInt(req.query.quality, 10) : 80;
//                 const alphaQuality = req.query.alphaQuality ? parseInt(req.query.alphaQuality, 10) : 100;
//                 lossless = req.query.lossless ? parseBool(req.query.lossless) : false;
//                 const nearLossless = req.query.nearLossless ? parseBool(req.query.nearLossless) : false;
//                 const smartSubsample = req.query.smartSubsample ? parseBool(req.query.smartSubsample) : false;
//                 const preset = req.query.preset || "default";
//                 effort = req.query.effort ? parseInt(req.query.effort, 10) : 4;
//                 const loop = req.query.loop ? parseInt(req.query.loop, 10) : 0;
//                 const delay = req.query.delay ? parseInt(req.query.delay, 10) : 100; //	number | Array.<number>
//                 const minSize = req.query.minSize ? parseBool(req.query.minSize) : false;
//                 const mixed = req.query.mixed ? parseBool(req.query.mixed) : false;
//
//                 force = req.query.force ? parseBool(req.query.force) : true;
//
//                 if (isNaN(quality) || +quality < 1 || +quality > 100) return res.status(400).json({ error: `Invalid quality ${outputFormat}. Should be an integer between 1 and 100.` });
//                 if (isNaN(alphaQuality) || +alphaQuality < 0 || +alphaQuality > 100) return res.status(400).json({ error: `Invalid alphaQuality ${outputFormat}. Should be an integer between 0 and 100.` });
//                 if (!["default", "photo", "picture", "drawing", "icon", "text"].includes(preset)) return res.status(400).json({ error: `Invalid preset ${outputFormat}. Allowed presets are default, photo, picture, drawing, icon, text.` });
//                 if (isNaN(effort) || +effort < 0 || +effort > 6) return res.status(400).json({ error: `Invalid effort ${outputFormat}. Should be an integer between 0 and 6.` });
//                 if (isNaN(loop) || +loop < 0 || +loop > 1000) return res.status(400).json({ error: `Invalid loop ${outputFormat}. Should be number of animation iterations, use 0 for infinite = 1000 animation` });
//                 if (isNaN(delay) || +delay < 1 || +delay > 10000) return res.status(400).json({ error: `Invalid delay ${outputFormat}. Should be delay(s) between animation frames (in milliseconds)` });
//
//                 sharpConfig = await sharpConfig.webp({
//                     quality : quality,
//                     alphaQuality : alphaQuality,
//                     lossless : lossless,
//                     nearLossless: nearLossless,
//                     smartSubsample : smartSubsample,
//                     preset : preset,
//                     effort: effort,
//                     loop : loop,
//                     delay : delay,
//                     minSize : minSize,
//                     mixed : mixed,
//                     force : force
//                 });
//                 break;
//             case "avif":
//                 console.log(`Output format: ${outputFormat} ... `);
//                 quality = req.query.quality ? parseInt(req.query.quality, 10) : 50;
//                 lossless = req.query.lossless ? parseBool(req.query.lossless) : false;
//                 effort = req.query.effort ? parseInt(req.query.effort, 10) : 4;
//                 chromaSubsampling =  req.query.chromaSubsampling || '4:4:4';
//
//                 if (isNaN(quality) || +quality < 1 || +quality > 100) return res.status(400).json({ error: `Invalid quality ${outputFormat}. Should be an integer between 1 and 100.` });
//                 if (isNaN(effort) || +effort < 0 || +effort > 9) return res.status(400).json({ error: `Invalid effort ${outputFormat}. Should be an integer between 0 and 9.` });
//                 if (!/^(\d+):(\d+):(\d+)$/.test(chromaSubsampling)) return res.status(400).json({ error: `Invalid chromaSubsampling ${outputFormat}. Should be e '4:4:4' set to '4:2:0' to use chroma subsampling` });
//
//                 sharpConfig = await sharpConfig.avif({
//                     quality : quality,
//                     lossless : lossless,
//                     effort : effort,
//                     chromaSubsampling : chromaSubsampling
//                 });
//                 break;
//             case "jpg":
//             default:
//                 console.log(`Output format: ${outputFormat} ... `);
//                 quality = req.query.quality ? parseInt(req.query.quality, 10) : 80;
//                 const progressive = req.query.progressive ? parseBool(req.query.progressive) : false;
//                 chromaSubsampling =  req.query.chromaSubsampling || '4:2:0';
//                 const optimiseCoding = req.query.optimiseCoding ? parseBool(req.query.optimiseCoding) : true;
//                 const mozjpeg = req.query.mozjpeg ? parseBool(req.query.mozjpeg) : false;
//                 const trellisQuantisation = req.query.trellisQuantisation ? parseBool(req.query.trellisQuantisation) : false;
//                 const overshootDeringing = req.query.overshootDeringing ? parseBool(req.query.overshootDeringing) : false;
//                 const optimiseScans = req.query.optimiseScans ? parseBool(req.query.optimiseScans) : false;
//                 const quantisationTable = req.query.quantisationTable ? parseInt(req.query.quantisationTable, 10) : 0;
//                 force = req.query.force ? parseBool(req.query.force) : true;
//
//                 if (!/^(\d+):(\d+):(\d+)$/.test(chromaSubsampling)) return res.status(400).json({ error: `Invalid chromaSubsampling ${outputFormat}. set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling` });
//                 if (isNaN(quality)|| +quality < 1 || +quality > 100) return res.status(400).json({ error: `Invalid quality ${outputFormat}. Should be an integer between 1 and 100.` });
//                 if (isNaN(quantisationTable)|| +quantisationTable < 0 || +quantisationTable > 8) return res.status(400).json({ error: `Invalid quantisationTable ${outputFormat}. Should be an integer between 1 and 8.` });
//
//                 sharpConfig = await sharpConfig.jpeg({
//                     quality : quality,
//                     progressive : progressive,
//                     chromaSubsampling: chromaSubsampling,
//                     optimiseCoding : optimiseCoding,
//                     mozjpeg : mozjpeg,
//                     trellisQuantisation : trellisQuantisation,
//                     overshootDeringing : overshootDeringing,
//                     optimiseScans : optimiseScans,
//                     quantisationTable : quantisationTable,
//                     force : force
//                 });
//                 break;
//         }
//
//         const { filePathWithoutFileName, fileNameWithoutExt, fileExt } =  pathNormalize(loaderTyp, imagePath);
//         console.log(`filePathWithoutFileName ${filePathWithoutFileName} ... `);
//         console.log(`fileNameWithoutExt ${fileNameWithoutExt} ... `);
//         console.log(`fileExt ${fileExt} ... `);
//         const outputStorage = req.query.outputStorage || 'stream';
//         const allowedOutputStorage = {
//             'local': true,
//             'mount': true,
//             'stream': true
//         };
//         if (!allowedOutputStorage.hasOwnProperty(outputStorage)) return res.status(400).send('Invalid "outputStorage" parameter');
//         const now = new Date();
//         switch (outputStorage) {
//             case "local":
//                 console.log(`outputStorage ${outputStorage} ... `);
//                 await createDirectory(__dirImagesResultLocal + "/" + filePathWithoutFileName);
//                 await sharpConfig.toFile(__dirImagesResultLocal + "/" +filePathWithoutFileName + "/" + fileNameWithoutExt + "." + outputFormat);
//
//                 return res.json({
//                     message: "File Process Successfully!",
//                     timestamp: now.toISOString()
//                 });
//             case "mount":
//                 console.log(`outputStorage ${outputStorage} ... `);
//                 await createDirectory(__dirImagesResultMount + "/" + filePathWithoutFileName);
//                 await sharpConfig.toFile(__dirImagesResultMount + "/" +filePathWithoutFileName + "/" + fileNameWithoutExt + "." + outputFormat);
//
//                 return res.json({
//                     message: "File Process Successfully!",
//                     timestamp: now.toISOString()
//                 });
//             case "stream":
//             default:
//                 console.log(`outputStorage default ... `);
//                 // Ustawienie odpowiedniego nagłówka Content-Type
//                 res.setHeader('Content-Type', 'image/jpeg');
//
//                 // Strumieniowanie obrazu do odpowiedzi
//                 return sharpConfig.pipe(res).on('error', function(error) {
//                     console.error("Pipe error response image: ", error);
//                     res.status(500).json({ error: "Internal Server Error", message: error.message});
//                 });
//         }
//
//     } catch (error) {
//         console.error("Internal Server Error", error);
//         return res.status(500).json({ error: "Internal Server Error", message: error.message});
//     }
//
// });
//
// export default router;