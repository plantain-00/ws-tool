const ejs = require("ejs");
const fs = require("fs");

/**
 * @param {string} str
 */
function md5(str) {
    return crypto.createHash("md5").update(str).digest("hex");
};

/**
 * @type {{ [name: string]: string; }} variables
 */
const variables = {};

ejs.renderFile("index.ejs", {
    commonCss: "",
    indexCss: "",
    commonJs: "",
    indexJs: ""
}, {}, (error, file) => {
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
