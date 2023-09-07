# sharp-web-resizing-images


<img src="https://cdn.jsdelivr.net/gh/lovell/sharp@main/docs/image/sharp-logo.svg" width="100" alt="logo">

## Description

The `sharp-web-resizing-images` repository contains Node.js code that utilizes the Sharp library for image manipulation. This code allows you to scale, convert image formats, and much more—all via an HTTP API interface. The code is modular and well-organized, facilitating the addition of new features and ongoing maintenance.

## Main Features

### Input Parameters

- **loaderTyp**: Type of image source (local, mounted, URL).
- **imagePath**: Path to the image.
- **outputFormat**: Output image format (jpg, webp, avif).
- **outputResize**: Dimensions to which the image is to be scaled.

Additional scaling options:

- **fit, position, background, kernel**: Options for scaling configuration.
- **quality, alphaQuality, lossless, etc.**: Options for configuring output formats.

### Supported Formats

- JPEG
- WebP
- AVIF

### Supported Scaling Methods

- **fit**: Image fitting
- **position**: Image position
- **background**: Background color
- **kernel**: Image processing method
- **withoutEnlargement, withoutReduction**: Control over size change

## Result Storage

Images can be saved on a local disk, external storage, or can be streamed as an HTTP stream.

## How to Use

#### curl -GET "http://localhost:8080?loaderTyp=local&imagePath=/path/to/image&outputFormat=webp&outputResize=200x200"

## Errors and Responses

The code is designed to inform the user about errors effectively. Possible responses include:

- **400 Bad Request**: In case of incorrect parameters.
- **500 Internal Server Error**: In case of server errors.

## Running in Docker

The project also includes a `docker-compose` file, making it easy to run in a container.

## License

MIT