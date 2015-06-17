var fs = require('fs');
var path = require('path');

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

        ']});\n',

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

var pluginsJsonPath = path.join(pluginsDir, 'plugins.json');
var pluginsJson = fs.readFileSync(pluginsJsonPath, {encoding: "utf8"});
pluginsJson = JSON.parse(pluginsJson);

var includedPlugins = pluginsJson["include"];
console.log("Included plugins: ", includedPlugins);

var excludedPlugins = pluginsJson["exclude"];
console.log("Excluded plugins: ", excludedPlugins);

includedPlugins.forEach(function(pluginName) {
    // Check for the existance of main.js inside a plugin's folder
    // This will throw an error if the path does not exist or is unaccessable
    try {
        fs.accessSync(path.join(pluginsDir, pluginName, 'main.js'));
    } catch (ex) {
        console.error('Error: Does the plugin \'' + pluginName + '\' exist?');
        throw ex;
    }
});

var dir = path.join(process.cwd(), 'build-config');

console.log("Generated plugin config files: ");

Object.keys(templates).forEach(function(key) {
    var filePath = path.join(dir, key);
    fs.writeFileSync(filePath, TemplateEngine(templates[key], {
        plugins: includedPlugins
    }));
    console.log(filePath);
});

console.log("========> End of plugins bootstrap.");