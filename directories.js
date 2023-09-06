import {fileURLToPath} from "url";
import {dirname} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __dirImagesLocal = __dirname + "/" + "images";
const __dirImagesMount = __dirname + "/" + "images";
const __dirImagesResultLocal = __dirname + "/" + "result";
const __dirImagesResultMount = __dirname + "/" + "result";

export {
    __filename,
    __dirname,
    __dirImagesLocal,
    __dirImagesMount,
    __dirImagesResultLocal,
    __dirImagesResultMount
};
