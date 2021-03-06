/*
 * Copyright (C) 2018 Ryan Mason - All Rights Reserved
 *
 * Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 *
 * https://github.com/Rytiggy/Glance/blob/master/LICENSE
 * ------------------------------------------------
 *
 * You are free to modify the code but please leave the copyright in the header.
 *
 * ------------------------------------------------
 */

export default class messaging {
    //Fetch data from an API endpoint and return a promise
    async get(url, params) {
        let trimmedURL = url.replace(/ /g, "");

        if (params) {
            const urlObj = new URL(trimmedURL);
            Object.entries(params).forEach(([key, value]) => urlObj.searchParams.set(key, value));
            trimmedURL = urlObj.toString();
        }

        console.log('Companion -> fetch: get data from ' + trimmedURL);

        return await fetch(trimmedURL)
            .then(handleResponse)
            .then(data => {
                const txt = Array.isArray(data) && data.length > 0 ?
                    'sgv: ' + data[0].sgv + ' time: ' + data[0].date : '';

                console.log(`Companion -> fetch: got data ${txt}`);
                return data;
            })
            .catch(error => {
                console.error('Error', error)
                // not found
                if (!error.status) {
                    error.status = '404'
                }
                //logs.add(`Line 35 ERROR companion - fetch - get() ${JSON.stringify(error)}`)
                let errorMsg = {
                    text: 'Line 38: Error with companion - fetch - get()',
                    error: error,
                    url: trimmedURL,
                }
                return errorMsg;
            });
    };
};

function handleResponse(response) {
    //console.error('handleResponse', response.type)
    let contentType = response.headers.get('content-type')
    if (contentType.includes('application/json')) {
        return handleJSONResponse(response)
    }
    else {
        // Other response types as necessary. I haven't found a need for them yet though.
        throw new Error(`Sorry, content-type ${contentType} not supported`)
    }
}

function handleJSONResponse(response) {
    return response.json()
        .then(json => {
            // console.warn('handleJSONResponse json', JSON.stringify(json))
            // console.warn('handleJSONResponse response', response.ok)

            if (response.ok) {
                //logs.add(`Line 83 companion - fetch - handleJSONResponse() response.ok`)
                return json
            } else {
                return Promise.reject(Object.assign({}, json, {
                    status: response.status,
                    statusText: response.statusText
                }))
            }
        })
}
