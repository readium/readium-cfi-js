
var fs = require('fs');
fs.exists(process.cwd() + '/open_webbrowser.js',
function(exists) {
    if (!exists) {
        console.log('web browser already open.');
        process.exit(-1);
    } else {
        console.log('web browser opening...');

        // var i = 0;
        // var MAX = 10;
        // var htmlFileExists = false;
  			// try {
  			// 		fs.accessSync(process.cwd() + '/dist/index.html');
        //     htmlFileExists = true;
  			// } catch (e) {
  			// 		// ignored
  			// }
        // while (i < MAX && !htmlFileExists) {
            // i++;
            // console.log('.');
        // }

        // console.log('./dist/index.html is ready.');
    }
});
