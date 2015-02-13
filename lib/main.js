// This addon is heavily inspired on the plugins userCSP (https://github.com/patilkr/userCSP) and 
// user agent switcher (https://github.com/Fabiensk/ua-site-switch)

const {Cc,Ci,Cr} = require("chrome");

var service;
var observer;

exports.main = function() {
    observer = {
        QueryInterface: function (iid) {
            if (iid.equals(Ci.nsIObserver) || iid.equals(Ci.nsISupports))
                return this;
            throw Cr.NS_ERROR_NO_INTERFACE;
        },
        observe: function(subject, topic, data)
        {
            /* Update User Agent to chrome on web.whatsapp.com, to battle against browser sniffing. */
            if (topic == "http-on-modify-request") {
                var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
                var host = httpChannel.getRequestHeader("Host");
                if (host == "web.whatsapp.com")
                    httpChannel.setRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36", false);
            }
        },
        get observerService() {
            return Cc["@mozilla.org/observer-service;1"]
            .getService(Ci.nsIObserverService);
        },
        register: function()
        {
            // false: no weak reference for listener
            this.observerService.addObserver(this, "http-on-modify-request", false);
        },
        unregister: function()
        {
            this.observerService.removeObserver(this, "http-on-modify-request");
        }
    };
    observer.register();

    /* Test if the whatsapp page has been patched, otherwise reload to get
     * it patched.
     * Fixes two problems. Sometimes the register function is too late,
     * causing people to see the 'not supported' page. And installing this
     * addon will now reload tabs that are showing the 'unsupported' page */
    var pageMod = require("sdk/page-mod");
    pageMod.PageMod({
        include: "https://web.whatsapp.com/*",
        attachTo: ["existing", "top"],
        contentScript:
            'if (document.getElementsByClassName("btn").length != 0)' +
            '    document.location.reload(true);'
    });
};

exports.onUnload = function() {
    observer.unregister();
}
