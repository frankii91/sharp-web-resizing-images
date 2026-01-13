// src/server.js
import express from "express";
import * as config from "./config.js";

import oneImage from "./oneImage.js";
import multiImage from "./multiImage.js";
import readme from "./readme.js";
import status from "./status.js";
import test from "./test.js";

import multer from "multer";
import expressJSDocSwagger from "express-jsdoc-swagger";
import { dirname } from "path";
import { fileURLToPath } from "url";
import "./swagger-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
    info: {
        version: "1.0.0",
        title: "SHARP API",
        license: { name: "MIT" },
    },
    baseDir: __dirname,
    filesPattern: "./**/*.js",
    swaggerUIPath: "/api-docs",
    exposeSwaggerUI: true,
    exposeApiDocs: false,
    apiDocsPath: "/v3/api-docs",
    notRequiredAsNullable: false,
    swaggerUiOptions: {},
    multiple: true,
};

const upload = multer({ dest: "./images" });

const app = express();
expressJSDocSwagger(app)(options);

// ✅ Express ma już swój parser (body-parser niepotrzebny)
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// routes
app.use("/one", oneImage);
app.use("/multi", multiImage);
app.use("/status", status);
app.use("/readme", readme);
app.use("/test", test);

// ✅ bez err w listen callback (to nie działa tak w express 4)
const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`Server SHARP Running on http://${config.HOST}:${config.PORT}`);
});

// ✅ ładne zamykanie (docker / ctrl+c)
const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
