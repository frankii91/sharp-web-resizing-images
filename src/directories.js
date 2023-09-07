const __dirImagesLocal = "/app/images";
const __dirImagesResultLocal = "/app/result";
const __dirImagesMount = process.env.SHARP_IMAGES_MOUNT || "/mnt/images";
const __dirImagesResultMount = process.env.SHARP_IMAGES_RESULT || "/mnt/result";

export {
    __dirImagesLocal,
    __dirImagesMount,
    __dirImagesResultLocal,
    __dirImagesResultMount
};
