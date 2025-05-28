const pkg = require("../package.json");
const nodeFetch = require("node-fetch");

let url = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;

let config = `${url}/config.json`;
let news = `${url}/news.json`;

class Config {
    GetConfig() {
        return new Promise((resolve, reject) => {
            nodeFetch(config)
                .then(async (config) => {
                    if (config.status === 200) return resolve(config.json());
                    else
                        return reject({
                            error: {
                                code: config.statusText,
                                message: "Server not accessible",
                            },
                        });
                })
                .catch((error) => {
                    return reject({ error });
                });
        });
    }
}

export default new Config;
