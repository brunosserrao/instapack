"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Shout_1 = require("../Shout");
const SassBuildTool_1 = require("../SassBuildTool");
module.exports = function (variables, finish) {
    return __awaiter(this, void 0, void 0, function* () {
        if (variables.verbose) {
            Shout_1.Shout.displayVerboseOutput = true;
        }
        if (variables.muteNotification) {
            Shout_1.Shout.enableNotification = false;
        }
        let tool = new SassBuildTool_1.SassBuildTool(variables);
        try {
            yield tool.buildWithStopwatch();
            if (variables.watch) {
                tool.watch();
            }
            else {
                finish(null);
            }
        }
        catch (error) {
            finish(error);
        }
    });
};
