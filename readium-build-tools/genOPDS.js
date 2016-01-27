var fs = require('fs');

var path = require('path');

//var http = require('http');
var https = require('https');

var parseString = require('xml2js').parseString;

// var git = require('gift');
// var glob = require('glob');
// var exec = require('child_process').exec;

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
    
    // var opdsXml = fs.readFileSync(opdsPath, 'utf8');
    // fs.writeFileSync(opdsPath, opdsXml, 'utf8');
}

var opdsXml = "";

opdsXml += '<feed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:odl="http://opds-spec.org/odl" xml:lang="en" xmlns:dcterms="http://purl.org/dc/terms/" xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:thr="http://purl.org/syndication/thread/1.0" xmlns:opds="http://opds-spec.org/2010/catalog">';
opdsXml += '\n';

var processListItem = function(list, i) {

    if (i >= list.length) {
        
        
        opdsXml += '</feed>';
        opdsXml += '\n';

        fs.writeFileSync(opdsPath, opdsXml, 'utf8');
        return;
    }

    var listItem = list[i];
    console.log(listItem.path);

    var urlContainerXmlPath = "/"+args[1]+"/"+args[2]+"/"+args[3]+"/"+listItem.path+"/META-INF/container.xml";

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
                            
                            
                var urlOpfPath = "/"+args[1]+"/"+args[2]+"/"+args[3]+"/"+listItem.path+"/"+opfPath;

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
                        
                        parseString(allData,
                        { explicitArray: false, ignoreAttrs: false },
                        function (err, json) {
                            
                            var coverHref = undefined;
                            var bookTitle = undefined;
                            
                            var _package = undefined;
                            if (json) {
                                _package = json.package;
                                if (!_package) {
                                    _package = json["opf:package"];
                                }
                            }
                            
                            if (_package) {
                                
                                var coverID = undefined;
                                
                                var _metadata = _package.metadata;
                                if (!_metadata) {
                                    _metadata = _package["opf:metadata"];
                                }
                                if (_metadata) {
                                    
                                    var _meta = _metadata.meta;
                                    if (!_meta) {
                                        _meta = _metadata["opf:meta"];
                                    }
                                    if (_meta) {
                                        
                                        var metas = Array.isArray(_meta) ? _meta : [_meta];
                                        
                                        for (var j = 0; j < metas.length; j++) {
                                            var meta = metas[j];
                                            
                                            for (var key in meta.$) {
                                            
                                                // console.log(key);
                                                // console.log(meta.$[key]);
                                                    
                                                if (key === "name" && meta.$[key] === "cover") {
                                                    var id = meta.$["content"];
                                                    if (id) {
                                                        coverID = id;
                                                        break;
                                                    }
                                                }
                                            }
                                            
                                            if (coverID) break;
                                        }
                                    }
                                    
                                    if (_metadata["dc:title"]) {
                                        
                                        var titles = Array.isArray(_metadata["dc:title"]) ? _metadata["dc:title"] : [_metadata["dc:title"]];
                                        
                                        for (var j = 0; j < titles.length; j++) {
                                            var title = titles[j];
                                            bookTitle = title._ ? title._ : title;
                                            
                                            console.log("==========> TITLE: " + bookTitle);
                                            break;
                                        }
                                    }
                                }
                                
                                var _manifest = _package.manifest;
                                if (!_manifest) {
                                    _manifest = _package["opf:manifest"];
                                }
                                var _manifestItem = undefined; 
                                if (_manifest) {
                                    _manifestItem = _manifest.item;
                                    if (!_manifestItem) {
                                        _manifestItem = _manifest["opf:item"];
                                    }
                                }
                                if (_manifestItem) {

                                    var items = Array.isArray(_manifestItem) ? _manifestItem : [_manifestItem];
                                    
                                    for (var j = 0; j < items.length; j++) {
                                        var item = items[j];
                                        
                                        var href = undefined;
                                        var match = false;
                                        
                                        for (var key in item.$) {
                                        
                                            // console.log(key);
                                            // console.log(meta.$[key]);
                                                
                                            if (coverID && key === "id" && item.$[key] === coverID) {
                                                
                                                match = true;
                                                
                                                if (href) {
                                                    coverHref = href;
                                                    break;
                                                }
                                            }
                                            
                                            if (!coverID && key === "properties" && item.$[key].indexOf("cover-image") >= 0) {
                                                
                                                match = true;
                                                
                                                if (href) {
                                                    coverHref = href;
                                                    break;
                                                }
                                            }
                                            
                                            if (key === "href") {
                                                
                                                href = item.$[key];
                                                
                                                if (match) {
                                                    
                                                    coverHref = href;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        if (coverHref) break;
                                    }
                                    
                                    if (coverHref) {
                                        console.log("==========> COVER: " + coverHref);
                                    }
                                }
                            }
                            
                            if (!bookTitle) {
                                console.log("==========> NO TITLE ?!");
                            }
                            
                            opdsXml += '<entry>';
                            opdsXml += '\n';
                                
                            opdsXml += '<title>' + bookTitle + '</title>';
                            opdsXml += '\n';
                            
                            opdsXml += '<author>';
                            opdsXml += '\n';
                                
                            opdsXml += '  <name>' + args[1]+"/"+args[2]+" ("+args[3]+") - "+ listItem.path + '</name>';
                            opdsXml += '\n';
                                                
                            opdsXml += '</author>';
                            opdsXml += '\n';
                            
                            var fullUrl = 'https://cdn.rawgit.com/'+args[1]+'/'+args[2]+'/'+args[3]+'/'+listItem.path;
                            opdsXml += '<link type="application/epub" href="'+fullUrl+'" rel="http://opds-spec.org/acquisition"/>';
                            opdsXml += '\n';
                            
                            if (coverHref) {
                                var contentType = "image/jpeg";
                                var coverHref_low = coverHref.toLowerCase();
                                if (coverHref_low.indexOf(".png") == (coverHref_low.length-4)) {
                                    contentType = "image/png";
                                }
                                else if (coverHref_low.indexOf(".gif") == (coverHref_low.length-4)) {
                                    contentType = "image/gif";
                                }
                                else if (coverHref_low.indexOf(".jpg") == (coverHref_low.length-4)) {
                                    contentType = "image/jpg";
                                }
                                opdsXml += '<link type="'+contentType+'" href="'+fullUrl + "/" + opfPath + "/../" + coverHref+'" rel="http://opds-spec.org/image/thumbnail"/>';
                                opdsXml += '\n';
                            }
                            
                            opdsXml += '</entry>';
                            opdsXml += '\n';
                            
                            processListItem(list, ++i);
                        });
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
