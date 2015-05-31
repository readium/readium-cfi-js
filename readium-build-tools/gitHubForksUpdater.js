// function() {

//repoNamePaths defined in caller's eval() context

// var args = process.argv.slice(2);

//console.log("gitHubForksUpdater.js arguments: ");
//console.log(args);

//console.log(process.cwd());
//process.exit(-1);

var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');

//https://github.com/blog/1509-personal-api-tokens
//https://github.com/settings/tokens
var ACCESSTOKEN = "fb424e90e36242ab9603034ea906a070c9ce2646";

var USERAGENT = "Readium-GitHub";

var httpGet = function(info, callback) {

    (info.ssl ? https : http).get(info.url, function(response) {

        // console.log("statusCode: ", response.statusCode);
        // console.log("headers: ", response.headers);

        response.setEncoding('utf8');

        response.on('error', function(error) {
            console.log(info.url);
            console.log(error);
            callback(info, undefined);
        });

        var allData = ''
        response.on('data', function(data) {
            allData += data;
        });

        response.on('end', function() {
            //console.log(allData);
            callback(info, allData);
        });
    });
};

var checkDiff = function(depSource, upstream) {

    var url = {
      hostname: 'api.github.com',
      port: 443,
      path: "/repos/" + upstream + "/compare/master..." + depSource + ":master" + "?access_token=" + ACCESSTOKEN,
      method: 'GET',

      headers: {
        "User-Agent": USERAGENT
      }
    };

    httpGet(
    {ssl: true, url: url, depSource: depSource, upstream: upstream},
    function(info, res) {

        if (!res) return;

        var gitData = JSON.parse(res);
        if (!gitData) return;


        //console.log(info.url);
        //console.log(res);
        console.log("+++++++ " + info.depSource + " >> " + info.upstream);

        if (gitData.behind_by) {

            console.log("!!!!!! NEEDS UPDATING");
            console.log(gitData.status);
            console.log(gitData.behind_by);

            console.log("---------------------------------");
            console.log("Recommended steps (command line):");
            console.log("---------------------------------");
            console.log("git clone git@github.com:"+info.depSource+".git");
            console.log("git remote add upstream git@github.com:"+info.upstream+".git");
            console.log("git checkout master");
            console.log("git fetch upstream");
            console.log("git merge upstream/master");
            console.log("git commit -a");
            console.log("git push");
            console.log("---------------------------------");

            //process.exit(1);
        } else {
            console.log("Up to date.");
        }
    });
};

var alreadyScannedDeps = [];

var scanDeps = function(deps) {

    for (var depName in deps) {
        var depSource = deps[depName];

        if (depSource.indexOf("/") == -1) continue;

        if (alreadyScannedDeps[depSource]) continue;
        alreadyScannedDeps[depSource] = true;

        //console.log(depSource);

        var url = {
          hostname: 'api.github.com',
          port: 443,
          path: "/repos/" + depSource + "?access_token=" + ACCESSTOKEN,
          method: 'GET',

          headers: {
            "User-Agent": USERAGENT
          }
        };

        httpGet(
        {ssl: true, url: url, depSource: depSource},
        function(info, res) {

            if (!res) return;

            var gitData = JSON.parse(res);
            if (!gitData) return;

            if (!gitData.source && !gitData.parent) {
                if (gitData.message)
                    console.log(res);
                return;
            }

            //console.log("++++++++");
            //console.log(info.url);
            //console.log(res);
            if (gitData.source) {
                //console.log("SOURCE: " + gitData.source.full_name);
                checkDiff(info.depSource, gitData.source.full_name);
            }

            if (gitData.parent && (gitData.parent.full_name != gitData.source.full_name)) {
                //console.log("PARENT: " + gitData.parent.full_name);
                checkDiff(info.depSource, gitData.parent.full_name);
            }
        });
    }
};

var repoPath = process.cwd();
var repoPackageFile = path.join(repoPath, 'package.json');

var repoPackageFileContents = fs.readFileSync(repoPackageFile, 'utf-8');

var repoPackage = JSON.parse(repoPackageFileContents);

scanDeps(repoPackage.dependencies);
scanDeps(repoPackage.devDependencies);

//
//
// for (var repoName in repoNamePaths) {
//     var repoPath = repoNamePaths[repoName];
//     //
//     console.log("=====================");
//     console.log(repoName);
//     console.log(repoPath);
//     // console.log("---------------");
//
//     // console.log("---------------");
// }

// }
