import * as path from "path";
import * as task from "azure-pipelines-task-lib/task";

const FLUTTER_TOOL_PATH_ENV_VAR: string = 'FlutterToolPath';

async function main(): Promise<void> {
    // 1. Check flutter environment
    var flutterPath = task.getVariable(FLUTTER_TOOL_PATH_ENV_VAR) || process.env[FLUTTER_TOOL_PATH_ENV_VAR];
    flutterPath = path.join(flutterPath, "flutter")
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
        await buildIpa(flutterPath, targetPlatform == "simulator", codesign, buildName, buildNumber, buildFlavour, buildFlags);
    }

    if (target === "all" || target === "apk") {
        let targetPlatform = task.getInput('apkTargetPlatform', false);
        await buildApk(flutterPath, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags);
    }

    if(target === "appbundle") {
        let targetPlatform = task.getInput('apkTargetPlatform', false);
        await buildAppBundle(flutterPath, targetPlatform, buildName, buildNumber, buildFlavour, buildFlags);
    }
    
    task.setResult(task.TaskResult.Succeeded, "Application built");
}

async function clean(flutter: string) {
    var result = await task.exec(flutter, ["clean"]);
    if (result !== 0) {
        throw new Error("clean failed");
    }
}

async function buildApk(flutter: string, targetPlatform?: string, buildName?: string, buildNumber?: string, buildFlavour?: string, buildFlags?: string) {

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
    } else {
        args.push("--release");
    }

    if (buildFlags) {
        args.push(buildFlags);
    }

    var result = await task.exec(flutter, args);

    if (result !== 0) {
        throw new Error("apk build failed");
    }
}

async function buildAppBundle(flutter: string, targetPlatform?: string, buildName?: string, buildNumber?: string, buildFlavour?: string, buildFlags?: string) {

    var args = [
        "build",
        "appbundle",
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
    } else {
        args.push("--release");
    }

    if (buildFlags) {
        args.push(buildFlags);
    }

    var result = await task.exec(flutter, args);

    if (result !== 0) {
        throw new Error("appbundle build failed");
    }
}

async function buildIpa(flutter: string, simulator?: boolean, codesign?: boolean, buildName?: string, buildNumber?: string, buildFlavour?: string, buildFlags?: string) {

    var args = [
        "build",
        "ios",
        "--pub"
    ];

    if (simulator) {
        args.push("--simulator");
        args.push("--debug");//simulator can only be build in debug
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
        } else {
            args.push("--release");
        }
    }

    if (buildFlags) {
        args.push(buildFlags);
    }

    var result = await task.exec(flutter, args);
    if (result !== 0) {
        throw new Error("ios build failed");
    }
}

main().catch(error => {
    task.setResult(task.TaskResult.Failed, error);
});