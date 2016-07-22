const ejs = require("ejs");
const fs = require("fs");
const crypto = require("crypto");

/**
 * @param {string} str
 * @returns {string}
 */
function md5(str) {
    return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * @param {string} path
 */
function getVersion(path) {
    const version = md5(fs.readFileSync(path).toString());
    fs.renameSync(path, path.replace("bundle", version));
    return version;
}

const variables = {
    commonCss: getVersion("common.bundle.css"),
    indexCss: getVersion("index.bundle.css"),
    commonJs: getVersion("common.bundle.js"),
    indexJs: getVersion("index.bundle.js")
};

ejs.renderFile("index.ejs", variables, {}, (error, file) => {
    if (error) {
        console.log(error);
    } else {
        fs.writeFile("index.html", file, error => {
            if (error) {
                console.log(error);
            } else {
                console.log("success");
            }
        });
    }
});
