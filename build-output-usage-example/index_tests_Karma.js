window.__karma__ = {
  info: function(info) {
    if (info.dump && window.console) window.console.log(info.dump);
  },
  complete: function() {
    window.console.log('Skipped ' + this.skipped + ' tests');
  },
  store: function() {},
  skipped: 0,
  result: window.console ? function(result) {
    if (result.skipped) {
      this.skipped++;
      return;
    }
    var msg = result.success ? 'SUCCESS ' : 'FAILED ';
    window.console.log(msg + result.suite.join(' ') + ' ' + result.description);

    for (var i = 0; i < result.log.length; i++) {
      window.console.error(result.log[i]);
    }
  } : function() {},
  loaded: function() {
    this.start();
  }
};

window.__karma__.config = {"args":[],"useIframe":true,"captureConsole":true};
