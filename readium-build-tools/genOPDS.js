var fs = require('fs');

var glob = require('glob');

var path = require('path');

var http = require('http');
var https = require('https');

var git = require('gift');

var exec = require('child_process').exec;

// fs.existsSync is marked as deprecated, so accessSync is used instead (if it's available in the running version of Node).
function doesFileExist(path) {
    var exists;
    if (fs.accessSync) {
        try {
            fs.accessSync(path);
            exists = true;
        } catch (ex) {
            exists = false;
        }
    } else {
        exists = fs.existsSync(path);
    }
    return exists;
}

//https://github.com/blog/1509-personal-api-tokens
//https://github.com/settings/tokens
//var ACCESSTOKEN = "fb424e90e36242ab9603034ea906a070c9ce2646";

var USERAGENT = "Readium-GitHub";

var args = process.argv.splice(2);

var browserURL = "https://github.com/"+args[1]+"/"+args[2]+"/tree/"+args[3]+args[4];
console.log("=== gen OPDS [" + args[0] + "] from [" + browserURL + "] ...");

var rootPath = process.cwd();
console.log(rootPath);

var opdsPath = path.join(rootPath, args[0]);
console.log(opdsPath);

if (doesFileExist(opdsPath)) {
    //console.log("~~ delete: " + opdsPath);
    //fs.unlinkSync(opdsPath);
    
    var opdsXml = fs.readFileSync(opdsPath, 'utf8');
    fs.writeFileSync(opdsPath, opdsXml, 'utf8');
}

var processListItem = function(list, i) {

    if (i >= list.length) return;

    var item = list[i];
    console.log(item.path);

    var urlContainerXmlPath = "/"+args[1]+"/"+args[2]+"/"+args[3]+"/"+item.path+"/META-INF/container.xml";

    var urlContainerXml = {
        hostname: 'raw.githubusercontent.com',
        port: 443,
        path: urlContainerXmlPath,
        method: 'GET',

        headers: {
        "User-Agent": USERAGENT
        }
    };
    console.log("https://" + urlContainerXml.hostname + urlContainerXml.path);

    https.get(urlContainerXml, function(response) {

        // console.log("statusCode: ", response.statusCode);
        // console.log("headers: ", response.headers);

        response.setEncoding('utf8');

        response.on('error', function(error) {
            console.log(error);
        });

        var allData = ''
        response.on('data', function(data) {
            allData += data;
        });

        response.on('end', function() {
            //console.log(allData);
            
            var regexp = /full-path="([^"]+)"/g;
            var match = allData.match(regexp);
            if (match.length) {
                //console.log(match);
                var opfPath = match[0].replace(regexp, "$1");
                console.log(opfPath);
                            
                            
                var urlOpfPath = "/"+args[1]+"/"+args[2]+"/"+args[3]+"/"+item.path+"/"+opfPath;

                var urlOpf = {
                    hostname: 'raw.githubusercontent.com',
                    port: 443,
                    path: urlOpfPath,
                    method: 'GET',

                    headers: {
                    "User-Agent": USERAGENT
                    }
                };
                console.log("https://" + urlOpf.hostname + urlOpf.path);

                https.get(urlOpf, function(response) {

                    // console.log("statusCode: ", response.statusCode);
                    // console.log("headers: ", response.headers);

                    response.setEncoding('utf8');

                    response.on('error', function(error) {
                        console.log(error);
                    });

                    var allData = ''
                    response.on('data', function(data) {
                        allData += data;
                    });

                    response.on('end', function() {
                        //console.log(allData);
                        
                        // var regexp = /full-path="([^"]+)"/g;
                        // var match = allData.match(regexp);
                        // if (match.length) {
                        //     //console.log(match);
                        //     var opfPath = match[0].replace(regexp, "$1");
                        //     console.log(opfPath);
                        // }
                        processListItem(list, ++i);
                    });

                });
            }
        });

    });
    
};


var urlPath = "/repos/"+args[1]+"/"+args[2]+"/contents"+args[4]+"?ref="+args[3];

var url = {
    hostname: 'api.github.com',
    port: 443,
    path: urlPath,
    method: 'GET',

    headers: {
    "User-Agent": USERAGENT
    }
};
console.log("https://" + url.hostname + url.path);

https.get(url, function(response) {

    // console.log("statusCode: ", response.statusCode);
    // console.log("headers: ", response.headers);

    response.setEncoding('utf8');

    response.on('error', function(error) {
        console.log(error);
    });

    var allData = ''
    response.on('data', function(data) {
        allData += data;
    });

    response.on('end', function() {
        //console.log(allData);
        
        var list = JSON.parse(allData);
        if (list.length) {
            processListItem(list, 0);
        }
    });

});
