EPUBcfi.Blacklist = {

    _blacklist: null,

    getBlacklist: function () {
        return this._blacklist || {};
    },

    setBlacklist: function (blacklist) {
        this._blacklist = blacklist;
    },

    appendBlacklist: function (blacklist) {
        var current = this.getBlacklist();
        var props = ["classBlacklist", "elementBlacklist", "idBlacklist"];
        $.each(props, function (i, prop) {
            if (blacklist[prop]) {
                current[prop] = current[prop] || [];
                current[prop] = current[prop].concat(blacklist[prop]);
                current[prop] = $.unique(current[prop]);
            }
        });
        this.setBlacklist(current);
    }
};