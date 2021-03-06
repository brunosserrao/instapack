"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const TypeScript = require("typescript");
const webpack_sources_1 = require("webpack-sources");
const Shout_1 = require("./Shout");
const RunWorker_1 = require("./workers/RunWorker");
function createMinificationInput(asset, fileName, sourceMap, ecma) {
    let input;
    if (sourceMap) {
        let o = asset.sourceAndMap();
        input = {
            fileName: fileName,
            code: o.source,
            ecma: ecma,
            map: o.map
        };
    }
    else {
        input = {
            fileName: fileName,
            ecma: ecma,
            code: asset.source()
        };
    }
    return input;
}
function minifyChunkAssets(compilation, chunks, sourceMap, ecma) {
    let tasks = [];
    Shout_1.Shout.timed('TypeScript compilation finished! Minifying bundles...');
    for (let chunk of chunks) {
        for (let fileName of chunk.files) {
            if (fileName.endsWith('js') === false) {
                continue;
            }
            let asset = compilation.assets[fileName];
            let input = createMinificationInput(asset, fileName, sourceMap, ecma);
            let t1 = RunWorker_1.runMinifyWorker(input);
            let t2 = t1.then(minified => {
                let output;
                if (sourceMap) {
                    output = new webpack_sources_1.SourceMapSource(minified.code, fileName, JSON.parse(minified.map), input.code, input.map);
                }
                else {
                    output = new webpack_sources_1.RawSource(minified.code);
                }
                compilation.assets[fileName] = output;
            }).catch(minifyError => {
                Shout_1.Shout.error(`when minifying ${chalk_1.default.blue(fileName)} during JS build:`, minifyError);
                if (ecma === 5) {
                    if (chunk.hasEntryModule() === false) {
                        Shout_1.Shout.warning('Project is targeting', chalk_1.default.yellow('ES5'), 'but one or more dependencies in', chalk_1.default.cyan('package.json'), 'might be ES2015+');
                    }
                    else {
                        Shout_1.Shout.warning('Possible TypeScript bug: ES5-transpiled project contains ES2015+ output?!');
                    }
                }
                compilation.errors.push(minifyError);
            });
            tasks.push(t2);
        }
    }
    return Promise.all(tasks);
}
class TypeScriptBuildMinifyPlugin {
    constructor(languageTarget) {
        this.ecma = 5;
        if (languageTarget === TypeScript.ScriptTarget.ES3 || languageTarget === TypeScript.ScriptTarget.ES5) {
            this.ecma = 5;
        }
        else if (languageTarget === TypeScript.ScriptTarget.ES2015) {
            this.ecma = 6;
        }
        else if (languageTarget === TypeScript.ScriptTarget.ES2016) {
            this.ecma = 7;
        }
        else {
            this.ecma = 8;
        }
    }
    apply(compiler) {
        let pluginId = 'typescript-build-minify';
        let enableSourceMaps = false;
        if (compiler.options.devtool) {
            enableSourceMaps = true;
        }
        compiler.hooks.compilation.tap(pluginId, compilation => {
            compilation.hooks.optimizeChunkAssets.tapPromise(pluginId, (chunks) => __awaiter(this, void 0, void 0, function* () {
                yield minifyChunkAssets(compilation, chunks, enableSourceMaps, this.ecma);
            }));
        });
    }
}
exports.TypeScriptBuildMinifyPlugin = TypeScriptBuildMinifyPlugin;
