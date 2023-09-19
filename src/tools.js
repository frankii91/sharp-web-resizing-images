import {promises as fs} from "fs";

const MAX_RETRIES = 3;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function retryRejectedPromises(promises, retries = 0) {
    if (retries >= MAX_RETRIES) {
        console.log("Maksymalna liczba prób została przekroczona."); // log
        return Promise.reject(new Error("Przekroczono maksymalną liczbę prób."));
    }

    return Promise.allSettled(promises)
        .then(results => {
            const rejectedPromisesIndices = results
                .map((p, index) => p.status === 'rejected' ? index : -1)
                .filter(index => index !== -1);

            if (rejectedPromisesIndices.length > 0) {
                console.error(`Niektóre obietnice zostały odrzucone. Próbuję ponownie (${retries + 1} z ${MAX_RETRIES})...`);

                rejectedPromisesIndices.forEach(index => {
                    console.log(`Obietnica o indeksie ${index} została odrzucona. Próbuję ponownie.`);
                });

                const retryPromises = rejectedPromisesIndices.map(index => promises[index]);

                // Dodajemy opóźnienie przed ponowną próbą
                return delay(5000 * (retries + 1)).then(() => retryRejectedPromises(retryPromises, retries + 1));

            } else {
                return results;
            }
        });
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


export {
    retryRejectedPromises,
    parseBool,
    validateBool
};