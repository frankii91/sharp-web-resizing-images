import {
    S3Client,
    ListBucketsCommand,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {AWS_ACCOUNT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_HOST} from "../config.js";
import crypto from 'crypto';
import {flattenObject} from "../tools.js";

async function Client(){
    try {
        return new S3Client({
            region: "auto",
            endpoint: `https://${AWS_ACCOUNT_ID}.${AWS_HOST}`,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
            logger: console
        });
    } catch (error) {
        console.error('Error Client connect:', error);
        throw new Error(`Error Client connect: ${error}`);
    }
}


// client.middlewareStack.add(
//     (next, context) => async (args) => {
//         const r = args.request;
//         r.headers["cf-create-bucket-if-missing"] = "true";
//         return await next(args)
//     },
//     { step: 'build', name: 'customHeaders' },
// )
async function test_AWS_PutObject(){

    const input = { // PutObjectRequest
        ACL: "private" || "public-read" || "public-read-write" || "authenticated-read" || "aws-exec-read" || "bucket-owner-read" || "bucket-owner-full-control",
        Body: "STREAMING_BLOB_VALUE",
        Bucket: "STRING_VALUE", // required
        CacheControl: "STRING_VALUE",
        ContentDisposition: "STRING_VALUE",
        ContentEncoding: "STRING_VALUE",
        ContentLanguage: "STRING_VALUE",
        ContentLength: Number("long"),
        ContentMD5: "STRING_VALUE",
        ContentType: "STRING_VALUE",
        ChecksumAlgorithm: "CRC32" || "CRC32C" || "SHA1" || "SHA256",
        ChecksumCRC32: "STRING_VALUE",
        ChecksumCRC32C: "STRING_VALUE",
        ChecksumSHA1: "STRING_VALUE",
        ChecksumSHA256: "STRING_VALUE",
        Expires: new Date("TIMESTAMP"),
        GrantFullControl: "STRING_VALUE",
        GrantRead: "STRING_VALUE",
        GrantReadACP: "STRING_VALUE",
        GrantWriteACP: "STRING_VALUE",
        Key: "STRING_VALUE", // required
        Metadata: { // Metadata
            "<keys>": "STRING_VALUE",
        },
        ServerSideEncryption: "AES256" || "aws:kms" || "aws:kms:dsse",
        StorageClass: "STANDARD" || "REDUCED_REDUNDANCY" || "STANDARD_IA" || "ONEZONE_IA" || "INTELLIGENT_TIERING" || "GLACIER" || "DEEP_ARCHIVE" || "OUTPOSTS" || "GLACIER_IR" || "SNOW",
        WebsiteRedirectLocation: "STRING_VALUE",
        SSECustomerAlgorithm: "STRING_VALUE",
        SSECustomerKey: "STRING_VALUE",
        SSECustomerKeyMD5: "STRING_VALUE",
        SSEKMSKeyId: "STRING_VALUE",
        SSEKMSEncryptionContext: "STRING_VALUE",
        BucketKeyEnabled: true || false,
        RequestPayer: "requester",
        Tagging: "STRING_VALUE",
        ObjectLockMode: "GOVERNANCE" || "COMPLIANCE",
        ObjectLockRetainUntilDate: new Date("TIMESTAMP"),
        ObjectLockLegalHoldStatus: "ON" || "OFF",
        ExpectedBucketOwner: "STRING_VALUE",
    };
    const command = new PutObjectCommand(input);
    const response = await client.send(command);

}

/*
metadane dal obiektu w cloudfalre r2 zgodność z aws s3
https://developers.cloudflare.com/r2/api/s3/api/

✅ System Metadata:
  ✅ Content-Type
  ✅ Cache-Control
  ✅ Content-Disposition
  ✅ Content-Encoding
  ✅ Content-Language
  ✅ Expires
  ✅ Content-MD5




 */
async function AWS_PutObject(stream, key, contentType, metaTags){
    const client = await Client();

    try {

        const md5sum = crypto.createHash('md5').update(stream).digest('base64');
        const input = {
            Body: stream,
            Bucket: AWS_BUCKET, // required
            Key: key.replace(/^\/+/, ""), // required
            ContentType: contentType,
            ContentDisposition: 'inline', // aby wyswietlało w przeglądarce a 'attachment;filename="filename.json"'  aby przeglądarka pobierałą plik z nazwą...
            ContentLanguage: 'pl-PL',
            ContentMD5: md5sum,
            Metadata: metaTags
        };

        // Oczekiwanie na wysłanie obiektu do S3
        const comres =  await client.send(new PutObjectCommand(input));
        console.debug(comres);

        return comres;
    } catch (error) {
        console.error(`Błąd podczas zapisu do S3. Klucz: ${key}. Szczegóły:`, error);
        throw new Error(`Błąd podczas zapisu do S3. Klucz: ${key}. Szczegóły: ${error}`);
    }
}

async function AWS_DeleteObject(key='/images/homeslider/1476/gk-meble-cc.jpg'){
    if (!key) {
        throw new Error("The keys parameter should be a non-empty string.");
    }

    const client = await Client();

    try {
        const input = {
            Bucket: AWS_BUCKET, // required
            Key: key.replace(/^\/+/, "") // required
        };

        // Oczekiwanie na wysłanie obiektu do S3
        const comres =  await client.send(new DeleteObjectCommand(input));
        console.debug(comres);

        return comres;
    } catch (error) {
        console.error(`Błąd podczas usuwania z S3. Klucz: ${key}. Szczegóły:`, error);
        throw new Error(`Błąd podczas usuwania z S3. Klucz: ${key}. Szczegóły: ${error}`);
    }
}
async function AWS_DeleteObjects(keys=['/images/homeslider/1476/gk-meble-cc.jpg']){
    if (!Array.isArray(keys) || !keys.length) {
        throw new Error("The keys parameter should be a non-empty array.");
    }

    const client = await Client();

    try {
        const input = {
            Bucket: AWS_BUCKET, // required
            Delete: {
                Objects: keys.map(key => ({ Key: key })),
                Quiet: true
            }
        };
        // Oczekiwanie na wysłanie obiektu do S3
        const comres =  await client.send(new DeleteObjectsCommand(input));
        console.debug(comres);

        return comres;
    } catch (error) {
        console.error(`Błąd podczas usuwania z S3. Klucz: ${key}. Szczegóły:`, error);
        throw new Error(`Błąd podczas usuwania z S3. Klucz: ${key}. Szczegóły: ${error}`);
    }
}
async function test(){
    const command = new PutObjectCommand({
        Bucket: "test",
        Key: "my_key",
        Body: "my_data"
    });

    const response = client.send(command);
    console.log(response);
    // console.log(
    //     await client.send(
    //         new ListBucketsCommand('')
    //     )
    // );
}

// console.log(
//     await client.send(
//         new ListBucketsCommand('')
//     )
// );
// {
//     '$metadata': {
//     httpStatusCode: 200,
//         requestId: undefined,
//         extendedRequestId: undefined,
//         cfId: undefined,
//         attempts: 1,
//         totalRetryDelay: 0
// },
//     Buckets: [
//     { Name: 'user-uploads', CreationDate: 2022-04-13T21:23:47.102Z },
//     { Name: 'my-bucket-name', CreationDate: 2022-05-07T02:46:49.218Z }
//     ],
//     Owner: {
//         DisplayName: '...',
//         ID: '...'
//     }
// }

// console.log(
//     await client.send(
//         new ListObjectsV2Command({ Bucket: AWS_BUCKET })
//     )
// );
// {
//     '$metadata': {
//       httpStatusCode: 200,
//       requestId: undefined,
//       extendedRequestId: undefined,
//       cfId: undefined,
//       attempts: 1,
//       totalRetryDelay: 0
//     },
//     CommonPrefixes: undefined,
//     Contents: [
//       {
//         Key: 'cat.png',
//         LastModified: 2022-05-07T02:50:45.616Z,
//         ETag: '"c4da329b38467509049e615c11b0c48a"',
//         ChecksumAlgorithm: undefined,
//         Size: 751832,
//         StorageClass: 'STANDARD',
//         Owner: undefined
//       },
//       {
//         Key: 'todos.txt',
//         LastModified: 2022-05-07T21:37:17.150Z,
//         ETag: '"29d911f495d1ba7cb3a4d7d15e63236a"',
//         ChecksumAlgorithm: undefined,
//         Size: 279,
//         StorageClass: 'STANDARD',
//         Owner: undefined
//       }
//     ],
//     ContinuationToken: undefined,
//     Delimiter: undefined,
//     EncodingType: undefined,
//     IsTruncated: false,
//     KeyCount: 8,
//     MaxKeys: 1000,
//     Name: 'my-bucket-name',
//     NextContinuationToken: undefined,
//     Prefix: undefined,
//     StartAfter: undefined
//   }

export {
    AWS_DeleteObjects,
    AWS_DeleteObject,
    AWS_PutObject,
    test
}