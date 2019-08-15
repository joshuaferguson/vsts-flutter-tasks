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
const path = require("path");
const task = require("azure-pipelines-task-lib/task");
const FLUTTER_TOOL_PATH_ENV_VAR = 'FlutterToolPath';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Check flutter environment
        var flutterPath = task.getVariable(FLUTTER_TOOL_PATH_ENV_VAR) || process.env[FLUTTER_TOOL_PATH_ENV_VAR];
        flutterPath = path.join(flutterPath, "flutter");
        if (!flutterPath) {
            throw new Error(`The '${FLUTTER_TOOL_PATH_ENV_VAR}' environment variable must be set before using this task (you can use 'flutterinstall' task).`);
        }
        // 2. Get target
        let target = task.getInput('target', true);
        // 3. Move current working directory to project
        let projectDirectory = task.getPathInput('projectDirectory', false, false);
        if (projectDirectory) {
            task.debug(`Moving to ${projectDirectory}`);
            task.cd(projectDirectory);
        }
        // 4. Get common input
        let buildName = task.getInput('buildName', false);
        let buildNumber = task.getInput('buildNumber', false);
        let buildFlavour = task.getInput('buildFlavour', false);
        let buildFlags = task.getInput('buildFlags', false);
        // 5. Builds
        if (target === "all" || target === "ios") {
            let targetPlatform = task.getInput('iosTargetPlatform', false);
            let codesign = task.getBoolInput('iosCodesign', false);
            yield buildIpa(flutterPath, targetPlatform == "simulator", codesign, buildName, buildNumber, buildFlavour, buildFlags);
        }
        if (target === "all" || target === "apk") {
            let targetPlatform = task.getInput('apkTargetPlatform', false);
            yield buildApk(flutterPath, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags);
        }
        if (target === "appbundle") {
            let targetPlatform = task.getInput('apkTargetPlatform', false);
            yield buildAppBundle(flutterPath, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags);
        }
        task.setResult(task.TaskResult.Succeeded, "Application built");
    });
}
function clean(flutter) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = yield task.exec(flutter, ["clean"]);
        if (result !== 0) {
            throw new Error("clean failed");
        }
    });
}
function buildApk(flutter, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags) {
    return __awaiter(this, void 0, void 0, function* () {
        var args = [
            "build",
            "apk",
            "--pub"
        ];
        if (targetPlatform) {
            args.push("--target-platform=" + targetPlatform);
        }
        if (buildName) {
            args.push("--build-name=" + buildName);
        }
        if (buildNumber) {
            args.push("--build-number=" + buildNumber);
        }
        if (buildFlavour) {
            args.push("--" + buildFlavour);
        }
        else {
            args.push("--release");
        }
        if (buildFlags) {
            args.push(buildFlags);
        }
        var result = yield task.exec(flutter, args);
        if (result !== 0) {
            throw new Error("apk build failed");
        }
    });
}
function buildAppBundle(flutter, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags) {
    return __awaiter(this, void 0, void 0, function* () {
        var args = [
            "build",
            "appbundle",
            "--pub",
            "--target-platform",
            "android-arm,android-arm64"
        ];
        if (buildName) {
            args.push("--build-name=" + buildName);
        }
        if (buildNumber) {
            args.push("--build-number=" + buildNumber);
        }
        if (buildFlavour) {
            args.push("--" + buildFlavour);
        }
        else {
            args.push("--release");
        }
        if (buildFlags) {
            args.push(buildFlags);
        }
        var result = yield task.exec(flutter, args);
        if (result !== 0) {
            throw new Error("appbundle build failed");
        }
    });
}
function buildIpa(flutter, simulator, codesign, buildName, buildNumber, buildFlavour, buildFlags) {
    return __awaiter(this, void 0, void 0, function* () {
        var args = [
            "build",
            "ios",
            "--pub"
        ];
        if (simulator) {
            args.push("--simulator");
            args.push("--debug"); //simulator can only be build in debug
        }
        else if (codesign) {
            args.push("--codesign");
        }
        if (buildName) {
            args.push("--build-name=" + buildName);
        }
        if (buildNumber) {
            args.push("--build-number=" + buildNumber);
        }
        if (!simulator) {
            if (buildFlavour) {
                args.push("--" + buildFlavour);
            }
            else {
                args.push("--release");
            }
        }
        if (buildFlags) {
            args.push(buildFlags);
        }
        var result = yield task.exec(flutter, args);
        if (result !== 0) {
            throw new Error("ios build failed");
        }
    });
}
main().catch(error => {
    task.setResult(task.TaskResult.Failed, error);
});
