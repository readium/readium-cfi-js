var fs = require('fs');
var path = require('path');
var cson = require('cson');

console.log("========>");
console.log("========> Plugins bootstrap ...");
console.log("========>");

// TemplateEngine
// Copyright (C) 2013 Krasimir Tsonev
// http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
// Released under the MIT license.
var TemplateEngine = function(text, options) {
    var re = /<%([^%>]+)?%>/g,
        reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
        code = 'var r=[];\n',
        cursor = 0,
        match;
    var add = function(line, js) {
        js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '");\n' : '');
        return add;
    }
    while (match = re.exec(text)) {
        add(text.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(text.substr(cursor, text.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

Object.deepExtend = function(destination, source) {
    for (var property in source) {
        if (source[property] && source[property].constructor &&
            source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            arguments.callee(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
};

var templates = {
    "RequireJS_config_plugins.js": '//Do not modify this file, it is automatically generated.\n' +

        'if(process._RJS_isBrowser){var p=[],c=require.config;require.config=function(k){c.apply(require,arguments);var n=k.packages;' +
        'n&&(p=n),require.config=c,window.setTimeout(function(){require(p.map(function(n){return n.name}),function(){console.log("Plugins loaded.")})},0)}}\n' +

        'require.config({packages:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '{\n' +
        'name: "readium_plugin_<%this.plugins[i]%>",\n' +
        'location: process._RJS_rootDir(1) + "/plugins/<%this.plugins[i]%>",\n' +
        'main: "main"\n' +
        '},\n' +
        '<%}%>' +

        '],'+
        '<%this.requireConfig%>'+
        '});\n',

    "RequireJS_config_plugins_multiple-bundles.js": '//Do not modify this file, it is automatically generated.\n' +
        'require.config({modules:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '{\n' +
        'name: "readium-plugin-<%this.plugins[i]%>",\n' +
        'create: true,\n' +
        'include: ["readium_plugin_<%this.plugins[i]%>"],\n' +
        'exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],\n' +
        'insertRequire: ["readium_plugin_<%this.plugins[i]%>"]\n' +
        '},\n' +
        '<%}%>' +

        ']});\n',

    "RequireJS_config_plugins_single-bundle.js": '//Do not modify this file, it is automatically generated.\n' +
        'require.config({include:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '"readium_plugin_<%this.plugins[i]%>",\n' +
        '<%}%>' +

        '],insertRequire:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '"readium_plugin_<%this.plugins[i]%>",\n' +
        '<%}%>' +

        ']});\n'
};

var pluginsDir = path.join(process.cwd(), 'plugins');

var pluginsCsonPathDefault = path.join(pluginsDir, 'plugins.cson');
var pluginsCsonDefault = fs.readFileSync(pluginsCsonPathDefault, {encoding: "utf8"});
pluginsCsonDefault = cson.parse(pluginsCsonDefault);


    var overridePlugins = true;

    // For example, command line parameter after "npm run SCRIPT_NAME":
    //--readium-js-viewer:RJS_PLUGINS_OVERRIDE=no
    // or:
    //--readium-shared-js:RJS_PLUGINS_OVERRIDE=false
    // or:
    //--readium-cfi-js:RJS_PLUGINS_OVERRIDE=FALSE
    //
    // ... or ENV shell variable, e.g. PowerShell:
    //Set-Item Env:RJS_PLUGINS_OVERRIDE no
    // e.g. OSX terminal:
    //RJS_PLUGINS_OVERRIDE=no npm run build
    //(temporary, process-specific ENV variable)
    console.log('process.env.npm_package_config_RJS_PLUGINS_OVERRIDE:');
    console.log(process.env.npm_package_config_RJS_PLUGINS_OVERRIDE);
    console.log('process.env[RJS_PLUGINS_OVERRIDE]:');
    console.log(process.env['RJS_PLUGINS_OVERRIDE']);
    if ((typeof process.env['RJS_PLUGINS_OVERRIDE'] === "undefined") && process.env.npm_package_config_RJS_PLUGINS_OVERRIDE)
    		process.env['RJS_PLUGINS_OVERRIDE'] = process.env.npm_package_config_RJS_PLUGINS_OVERRIDE;

    if (typeof process.env['RJS_PLUGINS_OVERRIDE'] !== "undefined") {
        var overridePlugins = process.env['RJS_PLUGINS_OVERRIDE'];
        overridePlugins = overridePlugins.toLowerCase();
        if (overridePlugins === "false" || overridePlugins === "no") {
            overridePlugins = false;
        } else {
            overridePlugins = true;
        }
    }


var pluginsCsonPathUser = path.join(pluginsDir, 'plugins-override.cson');
var pluginsCsonUser = null;
if (overridePlugins) {
    try {
        pluginsCsonUser = fs.readFileSync(pluginsCsonPathUser, {encoding: "utf8"});
        pluginsCsonUser = cson.parse(pluginsCsonUser);
    } catch (ignored) {}
}

var defaultPlugins = [], includedPlugins = [], excludedPlugins = [];

defaultPlugins = pluginsCsonDefault["plugins"];
console.log("Default plugins: ", defaultPlugins);

if (pluginsCsonUser) {
    includedPlugins = pluginsCsonUser.plugins["include"];
    console.log("Included plugins: ", includedPlugins);

    excludedPlugins = pluginsCsonUser.plugins["exclude"];
    console.log("Excluded plugins: ", excludedPlugins);
} else {
    console.log("No plugin entries to override.");
}

//union defaultPlugins and includedPlugins, without excludedPlugins
var pluginsToLoad = defaultPlugins
    .concat(includedPlugins)
    .filter(function (elem, i, arr) {
        return excludedPlugins.indexOf(elem) === -1 && arr.indexOf(elem) === i;
    });

console.log("Plugins to load: ", pluginsToLoad);

var pluginBuildConfigs = {};

pluginsToLoad.forEach(function(pluginName) {
    // Check for the existance of main.js inside a plugin's folder
    // This will throw an error if the path does not exist or is unaccessable
    try {
        fs.accessSync(path.join(pluginsDir, pluginName, 'main.js'));
    } catch (ex) {
        console.error('Error: Does the plugin \'' + pluginName + '\' exist?');
        throw ex;
    }

    // Parse build-config.json if it exists in the plugin dir
    try {
        var buildConfigCsonFile = path.join(pluginsDir, pluginName, 'build-config.cson');
        fs.accessSync(buildConfigCsonFile);
        var buildConfigCson = fs.readFileSync(buildConfigCsonFile, {encoding: "utf8"});
        var buildConfig = cson.parse(buildConfigCson);
        pluginBuildConfigs[pluginName] = buildConfig;
    } catch (ignored) {}
});

var pluginRequireJsConfig = {};
Object.keys(pluginBuildConfigs).forEach(function(pluginName) {
    try {
        var requireConfigObj = pluginBuildConfigs[pluginName].requireConfig;
        var requireConfigPaths = requireConfigObj.paths;
        Object.keys(requireConfigPaths).forEach(function(pathName) {
            var pathValue = requireConfigPaths[pathName];
            requireConfigPaths[pathName] = path.join("%%pluginsDir%%", pluginName, pathValue);
        });
        Object.deepExtend(pluginRequireJsConfig, requireConfigObj);
    } catch (e) {
        console.warn('Plugin `'+pluginName+'`: Failed to parse require js config.');
        console.log(e);
    }
});

var pluginRequireJsConfigJson = JSON.stringify(pluginRequireJsConfig, null, 2);
// Trim away the enclosing {} of the JSON string
pluginRequireJsConfigJson = pluginRequireJsConfigJson
    .substr(1, pluginRequireJsConfigJson.length - 2)
    .replace(/\"%%pluginsDir%%/g, "process._RJS_rootDir(1) + \"/plugins")

var dir = path.join(process.cwd(), 'build-config');

console.log("Generated plugin config files: ");

Object.keys(templates).forEach(function(key) {
    var filePath = path.join(dir, key);
    fs.writeFileSync(filePath, TemplateEngine(templates[key], {
        plugins: pluginsToLoad,
        requireConfig: pluginRequireJsConfigJson
    }));
    console.log(filePath);
});

console.log("========> End of plugins bootstrap.");
