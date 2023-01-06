const fs = require("fs");
const path = require("path");
const config = require('../app.json');
const staticContentMgr = require("./staticContentMgr");

const CACHE = new Map();

//TODO: optimize this -> collapse into one function

const readScreenToCache = (screen) => {
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';

    const parseFile = (file) => {
        if (path.extname(file) === '.html') {
            htmlContent += fs.readFileSync(file, 'utf8') + '\n';
        } else if (path.extname(file) === '.css') {
            cssContent += fs.readFileSync(file, 'utf8') + '\n';
        } else if (path.extname(file) === '.js') {
            jsContent += fs.readFileSync(file, 'utf8') + '\n';
        }
    }

    const parseDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.lstatSync(filePath).isFile()) {
                parseFile(filePath);
            } else if (fs.lstatSync(filePath).isDirectory()) {
                parseDir(filePath);
            }
        });
    }
    parseDir(path.join(__dirname, '..', 'screens', screen));

    //combine html and css
    if (htmlContent.includes('{{style}}')) {
        htmlContent = htmlContent.replace('{{style}}', `<style>${cssContent}</style>`);
    } else {
        htmlContent += `<style>${cssContent}</style>`;
    }

    //fill html and js with config values
    htmlContent = htmlContent.replace(/{{config:(.*?)}}/g, (match, p1) => {
        return config[p1] || '';
    });
    jsContent = jsContent.replace(/{{config:(.*?)}}/g, (match, p1) => {
        return config[p1] || '';
    });

    if (htmlContent.includes('{{framework}}')) {
        htmlContent = htmlContent.replace('{{framework}}', '<script>' + staticContentMgr.getJsContent() + '</script>');
    }

    //combine html and js when script placeholder is present
    if (htmlContent.includes('{{script}}')) {
        htmlContent = htmlContent.replace('{{script}}', `<script>${jsContent}</script>`);
        CACHE.set('s#' + screen, {
            html: htmlContent,
            lastModified: Date.now()
        });
    } else {
        CACHE.set('s#' + screen, {
            html: htmlContent,
            js: jsContent,
            lastModified: Date.now()
        });
    }
}

const readComponentToCache = (component) => {
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';

    const parseFile = (file) => {
        if (path.extname(file) === '.html') {
            htmlContent += fs.readFileSync(file, 'utf8') + '\n';
        } else if (path.extname(file) === '.css') {
            cssContent += fs.readFileSync(file, 'utf8') + '\n';
        } else if (path.extname(file) === '.js') {
            jsContent += fs.readFileSync(file, 'utf8') + '\n';
        }
    }

    const parseDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.lstatSync(filePath).isFile()) {
                parseFile(filePath);
            }
        });
    }

    if (!fs.existsSync(path.join(__dirname, '..', 'components', component)))
        return;

    parseDir(path.join(__dirname, '..', 'components', component));

    //combine html and css
    if (htmlContent.includes('{{style}}')) {
        htmlContent = htmlContent.replace('{{style}}', `<style>${cssContent}</style>`);
    } else {
        htmlContent += `<style>${cssContent}</style>`;
    }

    //fill html and js with config values
    htmlContent = htmlContent.replace(/{{config:(.*?)}}/g, (match, p1) => {
        return config[p1] || '';
    });
    jsContent = jsContent.replace(/{{config:(.*?)}}/g, (match, p1) => {
        return config[p1] || '';
    });

    CACHE.set('c#' + component, {
        html: htmlContent,
        js: jsContent,
        lastModified: Date.now()
    });
}

const getLastModified = (key) => {
    const item = CACHE.get(key);
    if (item) {
        return item.lastModified;
    }
    return -1;
}

module.exports = {
    CACHE,
    readScreenToCache,
    readComponentToCache,
    getLastModified
}