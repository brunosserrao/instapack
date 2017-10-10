"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minifier = require("html-minifier");
const through2 = require("through2");
const path = require("path");
const VueCompiler = require("vue-template-compiler");
let minifierOptions = {
    caseSensitive: false,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,
    conservativeCollapse: true,
    decodeEntities: false,
    html5: true,
    includeAutoGeneratedTags: true,
    keepClosingSlash: false,
    minifyCSS: false,
    minifyJS: false,
    minifyURLs: false,
    preserveLineBreaks: false,
    preventAttributesEscaping: false,
    processConditionalComments: false,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: false,
    removeEmptyElements: false,
    removeOptionalTags: false,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: false,
    sortAttributes: true,
    sortClassName: true,
    trimCustomFragments: false,
    useShortDoctype: false
};
let exts = new Set();
exts.add('.htm');
exts.add('.html');
exts.add('.xhtm');
exts.add('.xhtml');
exts.add('.tpl');
function functionWrap(s) {
    return 'function(){' + s + '}';
}
function functionArrayWrap(ar) {
    let result = ar.map(s => functionWrap(s)).join(',');
    return '[' + result + ']';
}
function Templatify(file, options) {
    return through2(function (buffer, encoding, next) {
        let ext = path.extname(file).toLowerCase();
        let isTemplate = exts.has(ext);
        if (!isTemplate) {
            return next(null, buffer);
        }
        let template = buffer.toString('utf8');
        template = minifier.minify(template, minifierOptions).trim();
        let error = '';
        switch (options.mode) {
            case 'vue': {
                let vueResult = VueCompiler.compile(template);
                let error = vueResult.errors[0];
                if (!error) {
                    template = '{render:' + functionWrap(vueResult.render)
                        + ',staticRenderFns:' + functionArrayWrap(vueResult.staticRenderFns)
                        + '}';
                }
                break;
            }
            case 'string': {
                template = JSON.stringify(template);
                break;
            }
            default: {
                error = 'Unknown templatify compilation mode!';
            }
        }
        if (error) {
            return next(Error(error));
        }
        template = 'module.exports = ' + template;
        return next(null, template);
    });
}
exports.default = Templatify;
