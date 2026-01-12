
import {StorageManagerV} from "./storage/resultStorage.js";
import {META_TAGS} from "./config.js";

// dla wznawiania obietnic jełsi sie nie powiodły jednak dla mnie nie działa wcale... może z pwoodu braku strumieni...
//
// const MAX_RETRIES = 3;
// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
// function retryRejectedPromises(promises, retries = 0) {
//     if (retries >= MAX_RETRIES) {
//         console.log("Maksymalna liczba prób została przekroczona."); // log
//         return Promise.reject(new Error("Przekroczono maksymalną liczbę prób."));
//     }
//
//     return Promise.allSettled(promises)
//         .then(results => {
//             const rejectedPromisesIndices = results
//                 .map((p, index) => p.status === 'rejected' ? index : -1)
//                 .filter(index => index !== -1);
//
//             if (rejectedPromisesIndices.length > 0) {
//                 console.error(`Niektóre obietnice zostały odrzucone. Próbuję ponownie (${retries + 1} z ${MAX_RETRIES})...`);
//
//                 rejectedPromisesIndices.forEach(index => {
//                     console.log(`Obietnica o indeksie ${index} została odrzucona. Próbuję ponownie.`);
//                 });
//
//                 const retryPromises = rejectedPromisesIndices.map(index => promises[index]);
//
//                 // Dodajemy opóźnienie przed ponowną próbą
//                 return delay(5000 * (retries + 1)).then(() => retryRejectedPromises(retryPromises, retries + 1));
//
//             } else {
//                 return results;
//             }
//         });
// }
// a tu wywołanie.....
//
// await retryRejectedPromises(promises)
//     .then(results => {
//         console.debug("Wszystkie obietnice zostały spełnione! w /one");
//         if(imageProcessing.outputStorage !== "stream"){
//             return res.status(200).json({ error: null, message: "OK" });
//         }
//     })
//     .catch(err => {
//         console.error("Nie udało się spełnić wszystkich obietnic nawet po wielokrotnych próbach", err);
//         // Usuń wszystkie zapisane pliki
//         for (const filePath of savedFiles) {
//             fs.unlink(filePath)
//                 .then(() => console.log(`Plik ${filePath} został usunięty.`))
//                 .catch(error => console.error(`Nie można usunąć pliku ${filePath}. Błąd: ${error.message}`));
//         }
//         return res.status(500).json({ error: "Internal Server Error", message: err.message });
//     });

async function processPromises(promises, res, outputStorage) {
    const results = await Promise.allSettled(promises);

    const anyRejected = results.some(r => r.status === 'rejected');

    if (anyRejected) {
        await withdrawalPromises(results);

        // jeśli stream już wysłał response -> nie wysyłaj JSON
        if (outputStorage === 'stream' || res?.headersSent) return;

        return res.status(500).json({
            error: "Internal Server Error",
            message: "Processing failed"
        });
    }

    // jeśli stream -> nic nie wysyłaj (bo obraz już poszedł)
    if (outputStorage === 'stream' || res?.headersSent) return;

    return res.status(200).json({
        error: null,
        message: "Processing finished. All files were generated and saved successfully."
    });
}


async function withdrawalPromises(results) {
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value && typeof result.value === 'object') {
            if (result.value.status === 'queued') continue;

            const { storageType, dirPath, fileName } = result.value || {};
            // jeśli nie ma danych do kasowania (np. value === undefined) -> pomiń
            if (!storageType || !dirPath || !fileName) continue;

            try {
                await new StorageManagerV(storageType, null, dirPath, fileName, null, null).delete();
                console.debug(`Deleted item for ${dirPath}/${fileName} storageType ${storageType}`);
            } catch (error) {
                console.error(`Error while deleting item for ${dirPath}/${fileName} storageType ${storageType}:`, error);
            }

        } else {
            // rejected -> masz w result.reason
            // const item = result.reason;
        }
    }
}


function parseBool(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        value = value.toLowerCase().trim();
        if (value === 'true' || value === '1') {
            return true;
        }
        if (value === 'false' || value === '0') {
            return false;
        }
        return false;
    }
    if (typeof value === 'number') {
        if (value === 1) {
            return true;
        }
        if (value === 0) {
            return false;
        }
    }
    return false;

}

function validateBool(value, name) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        value = value.toLowerCase().trim();
        if (value === 'true' || value === '1') {
            return true;
        }
        if (value === 'false' || value === '0') {
            return false;
        }
        throw new Error(`Error parse to bool ${name} is string`);
    }
    if (typeof value === 'number') {
        if (value === 1) {
            return true;
        }
        if (value === 0) {
            return false;
        }
    }
    throw new Error(`Error parse to bool ${name}`);
}
function flattenObject(ob) {
    let toReturn = {};

    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i]) && ob[i] !== null) {
            let flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '--' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = typeof ob[i] === 'string' ? ob[i] : JSON.stringify(ob[i]);
        }
    }
    return toReturn;
}
function unflattenObject(data) {
    if (typeof data !== 'object' || data === null) return data; // handling non-object types or null

    let result = {};

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            let keys = key.split('--');
            keys.reduce((r, e, j, a) => {
                if (j === a.length - 1) {
                    r[e] = data[key]; // assign the value
                    return r;
                }
                if (!r[e]) r[e] = isNaN(Number(a[j + 1])) ? {} : [];
                return r[e]; // continue to the next key
            }, result);
        }
    }

    return result;
}

// async function saveMetaTags(imageProcessing){
//     if(META_TAGS){
//         try{
//             const json = imageProcessing.toJSON();
//             const jsonStr = JSON.stringify(json); // konwertuje obiekt na string JSON
//             const bufor = Buffer.from(jsonStr); // tworzy bufor z stringa JSON
//             return await new StorageManagerV(imageProcessing.outputStorage, bufor, imageProcessing.filePathWithoutFileName, 'metatags.json', null, 'application/json').save();
//         }  catch (error){
//             throw new Error(`Error in saveMetaTags: `, error);
//
//         }
//     }
// }

async function saveMetaTags(imageProcessing){
    if (!META_TAGS) return;

    const jsonStr = JSON.stringify(imageProcessing.toJSON());
    const bufor = Buffer.from(jsonStr);

    const metaStorage = imageProcessing.outputStorage === 'stream'
        ? 'local'
        : imageProcessing.outputStorage;

    return await new StorageManagerV(
        metaStorage,
        bufor,
        imageProcessing.filePathWithoutFileName,
        'metatags.json',
        null,
        'application/json',
        null
    ).save();
}

export {
    flattenObject,
    saveMetaTags,
    processPromises,
    parseBool,
    validateBool
};