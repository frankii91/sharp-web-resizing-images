
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

async function processPromises(promises) {
    const results = await Promise.allSettled(promises);

    // Check if any promise was rejected
    const anyRejected = results.some(result => result.status === 'rejected');

    if (anyRejected) {
        await withdrawalPromises(results);
    } else {
        console.debug("Processing finished. All files were generated and saved successfully.");
    }
}

async function withdrawalPromises(results) {
    for (const result of results) {
        // If the promise was fulfilled, we get its value. Otherwise, we get the reason for rejection.
        if (result.status === 'fulfilled' && 'value' in result) {
            try{
                const { storageType, dirPath, fileName } = result.value;
                try {
                    await new StorageManagerV(storageType, null, dirPath, fileName, null, null).delete();
                    console.debug(`Deleted item for ${dirPath}/${fileName} storageType ${storageType}`);
                } catch (error) {
                    console.error(`Error while deleting item for ${dirPath}/${fileName} storageType ${storageType}:`, error);
                }
            }catch (error) {
                console.error(`Error parse: const { storageType, dirPath, fileName } = result.value;:`, error);
            }

        } else {
            const item = result.reason;
        }
    }
}

function parseBool(value) {
    if (typeof value === 'boolean') {
        return true;
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
        // value = value.toLowerCase().trim();
        // if (value === 'true' || value === '1') {
        //     return true;
        // }
        // if (value === 'false' || value === '0') {
        //     return false;
        // }
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
    const toReturn = {};

    for (const i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
            const flatObject = flattenObject(ob[i]);
            for (const x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[`${i}.${x}`] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}
function unflattenObject(data) {
    var result = {};
    for (var key in data) {
        var keys = key.split('.');
        keys.reduce(function(r, e, j) {
            return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 === j ? data[key] : {}) : []);
        }, result);
    }
    return result;
}

async function saveMetaTags(imageProcessing){
    if(META_TAGS){
        try{
            const json = imageProcessing.toJSON();
            const jsonStr = JSON.stringify(json); // konwertuje obiekt na string JSON
            const bufor = Buffer.from(jsonStr); // tworzy bufor z stringa JSON
            return await new StorageManagerV(imageProcessing.outputStorage, bufor, imageProcessing.filePathWithoutFileName, 'metatags.json', null, 'application/json').save();
        }  catch (error){
            throw new Error(`Error in saveMetaTags: `, error);

        }
    }
}

export {
    saveMetaTags,
    processPromises,
    parseBool,
    validateBool
};