import express from 'express';
import * as config from './config.js';
//import oneImage from './oneImage.js';
import oneImage from './oneImage2.js';
import multiImage from './multiImage.js';
import readme from './readme.js';
import status from './status.js';
import bodyParser from 'body-parser';
import multer from 'multer';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {test} from './file_storage_cloudflarer2.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
    info: {
        version: '1.0.0',
        title: 'Albums store',
        license: {
            name: 'MIT',
        },
    },
    security: {
        BasicAuth: {
            type: 'http',
            scheme: 'basic',
        },
    },
    // Base directory which we use to locate your JSDOC files
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: './**/*.js',
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/api-docs',
    // Expose OpenAPI UI
    exposeSwaggerUI: true,
    // Expose Open API JSON Docs documentation in `apiDocsPath` path.
    exposeApiDocs: false,
    // Open API JSON Docs endpoint.
    apiDocsPath: '/v3/api-docs',
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
    // You can customize your UI options.
    // you can extend swagger-ui-express config. You can checkout an example of this
    // in the `example/configuration/swaggerOptions.js`
    swaggerUiOptions: {},
    // multiple option in case you want more that one instance
    multiple: true,
};

const upload = multer({dest : './images'})

const app = express();

expressJSDocSwagger(app)(options);

/**
 * GET /api/v1/albums
 * @summary This is the summary of the endpoint
 * @tags album
 * @return {array<Song>} 200 - success response - application/json
 * @example response - 200 - success response example
 * [
 *   {
 *     "title": "Bury the light",
 *     "artist": "Casey Edwards ft. Victor Borba",
 *     "year": 2020
 *   }
 * ]
 */
app.get('/api/v1/albums', (req, res) => (
    res.json([{
        title: 'track 1',
    }])
));

app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json());

app.post('/upload33331111c', upload.single("avatar"), async (req, res)=>
{
    return res.json("upload3333 Successfully!");
});
app.use('/one', oneImage);
app.use('/multi', multiImage);
app.use('/status', status);
app.use('/readme', readme);
app.listen(config.PORT, config.HOST, () => {
    console.log(`Server SHARP Running on http://${config.HOST}:${config.PORT}`);
});



