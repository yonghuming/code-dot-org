// It's not really a JSX yet.
(function () {

  // class UIFrame
  var UIFrame = (function () {

    var loaded_resources = {};

    // Create an AJAX transport for static script loading
    // This works for both file:// and http:// links
    // 1. File is loaded as a <SCRIPT> tag
    // 2. The file contains a call to RESOURCE({ ...json... });
    // 3. RESOURCE() stores the JSON away for later retrieval
    window.RESOURCE = function (json) {
      loaded_resources[Math.random(1)] = json;
    };
    $.ajaxTransport("static", function (s) {
      var script, callback, result;
      return {
        send: function (_, complete) {

          // If needed, we could create a way to store or simulate postbacks.
          if (s.type != 'GET') {
            throw new Error(s.type + "s are not supported.")
          }

          if (s.isStaticResource) {
            s.dataTypes[0] = "json";
            s.url += "?jsonp=RESOURCE";
          } else {
            s.dataTypes[0] = "script";
          }

          script = jQuery("<script>", {
            charset: s.scriptCharset,
            src: s.url
          }).on("load error", callback = function (evt) {
            // If we remove this, we can't debug it.
            // script.remove();
            callback = null;

            if (s.isStaticResource) {
              // TODO: are there asynchronicity issues here?
              var json;
              for (var key in loaded_resources) {
                json = loaded_resources[key];
                delete loaded_resources[key];
                break;
              }

              result = {json: json};
            }

            if (evt) {
              complete(evt.type === "error" ? 404 : 200, evt.type, result);
            }
          });
          document.head.appendChild(script[0]);
        },
        abort: function () {
          if (callback) {
            callback();
          }
        }
      };
    });

    var rootUrl = function (url) {
      var root = url.match(/^\w+:\/\/[^\/]*/);
      return root[0];
    };

    function UIFrame() {
    }

    UIFrame.prototype.init = function () {
      // Static environment ignores BASE HREF and looks for resources in the directory of this script.
      this.isStatic = this.detectStatic();

      // There are three possible environments:
      if (this.isSinglePage) {
        // a file:// URL
        this.rootUrl = this.baseUrl = document.URL.substr(0, document.URL.lastIndexOf('/'));

        // For now, initial scripts and CSS are still loaded from the server using a BASE HREF
        // pointing at the server.  Once the initial assets are loaded, everything else
        // is loaded from relative paths on the static site, so we remove it.
        // Once assets are bundled for static mode, we won't need to have the BASE HREF at all,
        // and we will remove all references to this.serverRoot.
        this.serverRoot = rootUrl(this.baseURI());
        $('base').remove();

        // Hook into the global CSRF handler for debugging requests to the server.
        this.patchCSRF();
      } else if (this.isStatic) {
        // a static server URL
        this.serverRoot = this.rootUrl = this.baseUrl = rootUrl(document.URL.substr(0, document.URL.lastIndexOf('/')));
      } else {
        // a live server URL
        this.baseUrl = this.baseURI();
        this.serverRoot = this.rootUrl = window.location.protocol + "//" + window.location.host;
      }

      this.router = new UIRouter();
      this.router.route();
    };

    // http://stackoverflow.com/a/21152762/7104
    // Decode query parameters
    UIFrame.prototype.queryParams = function (url) {
      if (this._qp) {
        return this._qp;
      }

      url = url || location.search;
      if (!url) {
        return null;
      }

      var qd = {};
      url.substr(1).split("&").forEach(function (item) {
        var k = item.split("=")[0],
            v = decodeURIComponent(item.split("=")[1]);
        (k in qd) ? qd[k].push(v) : qd[k] = [v]
      });

      this._qp = qd;
      return qd;
    };

    // This is work in progress to patch the XmlHttpRequest service to prevent us from making
    // requests to a file:// URL (because that will fail and prevent other scripts from running.)
    // It also forces the CSRF token into all requests, although there are other ways to do
    // that once we get all the $.ajax() calls under control.
    UIFrame.prototype.patchCSRF = function () {
      var token = $('meta[name=csrf-token]').attr('content');

      var send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (data) {
        if (this.skip) {
          return;
        }
        return send.apply(this, arguments);
      };

      var open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (data) {
        var resp = open.apply(this, arguments);

        if (arguments[1].substr(0, 5) == 'file:') {
          console.error('skipping ' + arguments[1]);
          this.skip = true;
        }

        // TODO: We're using JQuery from Rails, so it automatically adds this.
        // Is that really what we want to do?
        // this.setRequestHeader('X-CSRF-Token', token);

        return resp;
      };
    };

    // Create an absolute path to a resource.  The second parameter is temporary - only used in a static
    // site that still has references to a dynamic server.
    UIFrame.prototype.getAbsolutePath = function (path, rootUrl) {
      if (path[0] == '/') {
        return (rootUrl || this.rootUrl) + path;
      }
      return (rootUrl || this.baseUrl) + "/" + path;
    };

    UIFrame.prototype.baseURI = function () {
      // Check expected property.
      if (document.baseURI) {
        return document.baseURI;
      }
      var base = document.getElementsByTagName('base');
      if (base.length > 0) {
        return base[0].href;
      }
      return document.URL;
    };

    // Eventually we could support various modes of offline (disconnects, etc)
    UIFrame.prototype.detectStatic = function () {
      // file: URL is static AND single-page
      if (window.location.protocol == 'file:') {
        this.isSinglePage = true;
        return true;
      }

      // react.studio.code.org is static but not single-page
      if (window.location.host.substr(0, 6) == 'react.') {
        return true;
      }

      /* Enable this to test static on your local dev machine.
       if (window.location.port == 3000)
       return true;
       */
      return false;
    };

    // Load the script at a given URL and return a promise that resolves when it has executed
    UIFrame.prototype.load = function (ajax, resolveStatic) {
      if (this.isStatic) {
        ajax.type = ajax.type || 'GET';

        // Static resolution replaces the URL with a static equivalent
        if (resolveStatic) {
          // All static resources are wrapped as .JS files
          var staticPath = resolveStatic(ajax.data) + ".js";

          if (this.isSinglePage) // TODO: also isStatic, when we have a static asset building pipeline
          {
            ajax.url = "assets/" + staticPath;
          } else {
            ajax.url = this.getAbsolutePath(staticPath, this.serverRoot);
          }

          delete ajax.data; // Static resources can't do anything with params
          ajax.cache = true;  // Static resources will have long cache times
          ajax.isStaticResource = true;  // Expect a JSONP resoponse
        } else {
          if (ajax.dataType != 'script') {
            console.error("Request for " + ajax.url + " has no static handler.")
          }
        }

        // All resources must be loaded via <SCRIPT> tag when offline.
        ajax.dataType = "static";
      } else if (ajax.dataType == "script") {
        // Use our static script loader instead of $.getScript, which deletes the <script>
        // element and makes it hard to debug into the script.
        ajax.dataType = "static";
      }

      return $.ajax(ajax);
    };

    // Write to an API - assumes a POST that returns JSON
    UIFrame.prototype.save = function (ajax) {
      ajax.method = ajax.method || "POST";
      ajax.dataType = ajax.dataType || "json";
      ajax.contentType = ajax.contentType || "application/x-www-form-urlencoded";

      return this.load(ajax);
    };

    // Load the script at a given URL and return a promise that resolves when it has executed
    UIFrame.prototype.loadSource = function (url) {
      return this.load({
        url: url,
        dataType: "script",
        cache: true
      });
    };

    // Loads the given app stylesheet.
    UIFrame.prototype.loadStyle = function (url) {
      $('<link>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: url
      }).appendTo(document.head);
    };

    // Return a route to a link.  This interface will be improved when we use a real router.
    UIFrame.prototype.linkTo = function (route, forceOnline) {
      if (Array.isArray(route)) {  // IE9+
        route = {
          script: route[0],
          stage: route[1],
          level: route[2]
        }
      }

      if (route.signin) {
        return "/users/sign_in";
      }

      // Calculate route for script levels
      if (route.script) {
        if (this.isSinglePage && !forceOnline) {
          return window.location.pathname + "?" + $.param(route, true);
        }

        return "/s/" + route.script + "/stage/" + route.stage + "/puzzle/" + route.level;
      }

      if (route.complete) {
        // For now, completion routes are always online.
        // TODO: Are there other cases?
        switch (route.complete) {
          case 'Hour of Code':
            return "http://code.org/api/hour/finish";
          default:
            return "http://code.org/api/hour/finish/" + route.complete;
        }
      }

      // Not a recognized route
      return null;
    };

    UIFrame.prototype.goTo = function (route) {
      var url = this.linkTo(route);
      if (!url) {
        return false;
      }

      window.location.href = url;
      return true;
    };

    // Pass one or more arguments, they'll be string-concat'd
    UIFrame.prototype.assetUrl = function () {
      var url = Array.prototype.join.call(arguments, '');

      return this.getAbsolutePath("/assets/" + url);
    };

    return UIFrame;
  })();

  window.UIFrame = UIFrame;

})();
