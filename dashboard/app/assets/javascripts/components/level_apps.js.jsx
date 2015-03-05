// It's not really a JSX yet.

// New private scope -- a lot of this is boilerplate for class structures, taken from coffeescript
(function() {
  var __extends = function(child, parent) { for (var key in parent) { if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  // class App, the base class for all level apps - provides some useful functions that all
  // level types will probably want to use, including milestone reporting, callouts, etc.
  var App = (function() {

    // Must have a constructor
    function App(opts) {
      $.extend(this, {
        Dialog: Dialog,
        cdoSounds: CDOSounds,
        position: { blockYCoordinateInterval: 25 }
      }, opts);

      // Turn string values into functions for keys that begin with 'fn_' (JSON can't contain function definitions)
      // E.g. { fn_example: 'function () { return; }' } becomes { example: function () { return; } }
      (function fixUpFunctions(node) {
        if (typeof node !== 'object') return;

        for (var i in node) {
          if (/^fn_/.test(i)) {
            try {
              node[i.replace(/^fn_/, '')] = eval('(' + node[i] + ')');
            } catch (e) { }
          } else {
            fixUpFunctions(node[i]);
          }
        }
      })(this.level);

      this.onAttempt = this.onAttempt.bind(this);
      this.onContinue = this.onContinue.bind(this);
      this.backToPreviousLevel = this.backToPreviousLevel.bind(this);
      this.onResetPressed = this.onResetPressed.bind(this);

      return this;
    }

    $.extend(App.prototype, {
      loadSource: function(filename, locale) {
        var _this = this;

        return function () {
          if (locale)
            filename = locale + "/" + filename;
          return Frame.loadSource(_this.baseUrl + "js/" + filename + ".js");
        };
      },

      loadStyle: function(name) {
        return Frame.loadStyle(this.baseUrl + 'css/' + name + '.css');
      },

      onInitialize: function() {
        $(document).trigger('appInitialized', this);
      },

      onAttempt: function(report) {
        var scriptPath = this.scriptPath;
        var _this = this;

        // Track puzzle attempt event
        trackEvent('Puzzle', 'Attempt', scriptPath, report.pass ? 1 : 0);
        if (report.pass) {
          trackEvent('Puzzle', 'Success', scriptPath, report.attempt);
          window.stopTiming('Puzzle', scriptPath, '');
        }
        trackEvent('Activity', 'Lines of Code', scriptPath, report.lines);

        // ==============
        // TODO: Removing lastServerResponse -- and therefore nextRedirect, previousLevelRedirect, and videoInfo has broken
        // all other level types besides Blockly.
        // They'll need to be updated to the new method of querying the level info (which is a good idea anyway since they are just
        // extra copies of the same code.)
        // ==============

        var onMilestone = function(response) {
          _this.report = null;

          // This used to be passed back from the milestone API.  It's used in a place that might not have easy access to
          // scriptPath, so we pack it in until we can remove that location.
          response.levelPath = scriptPath;

          if (report.onComplete)
            report.onComplete(response);
        };

        var data = $.extend({}, report);
        delete data.onComplete;

        var user = window.userInfoStore.value || { id: 0 };
        var milestone_url = Frame.getAbsolutePath('/milestone/' + user.id + '/' + this.level.sl_id);

        // Make a POST request to the milestone API
        if (this.report)
          this.report.abort();
        this.report = Frame.save({
          url: milestone_url,
          data: data,
          success: onMilestone,
          error: function (xhr, textStatus, thrownError) {
            // Ignore an aborted API call
            if (textStatus == "abort")
              return;

            // It's okay if milestone fails. Catch the error and pretend it succeeded with minimal info.
            onMilestone({
              'error': xhr.responseText,
              message: report.pass ? 'good job' : 'try again',
              design: 'white_background'
            });
          }
        });
      },
      onResetPressed: function() {
        if (this.report) {
          this.report.abort();
          this.report = null;
        }
      },
      onContinue: function() {
        var route;

        // Is this level the script completion?
        if (this.level.next === false) {
          route = {
            complete: this.script_name
          };
        } else {
          // Calculate the next level and route to it.
          var next = this.level.next || [ this.level.stage, this.level.position + 1];
          route = {
            script: this.script_name,
            stage: next[0],
            level: next[1]
          };
        }

        // If this level has a wrap-up video, show it before moving on.
        if (this.level.wrapupVideo) {
          this.level.wrapupVideo.redirect = Frame.linkTo(route);  // someday, can just pass in a route.
          showVideoDialog(this.level.wrapupVideo);
        } else {
          if (!Frame.goTo(route)) {
            // What kind of message should the user get?
          }
        }
      },
      backToPreviousLevel: function() {
        if (this.level.previous === false) {
          // Does this mean anything or do we just fail silently?
          return;
        }

        // Calculate the previous level and route to it.
        var prev = this.level.previous || [ this.level.stage, this.level.position - 1];
        var route = {
          script: this.script_name,
          stage: prev[0],
          level: prev[1]
        };
        if (!Frame.goTo(route)) {
          // What kind of message should the user get?
        }
      },
      showInstructionsWrapper: function(showInstructions) {
        var hasInstructions = this.level.instructions || this.level.aniGifURL;
        if (!hasInstructions || this.share || this.level.skipInstructionsPopup) {
          return;
        }

        if (this.autoplayVideo && !(Frame.queryParams() || {}).noautoplay) {
          showVideoDialog(this.autoplayVideo);
          $('.video-modal').on('hidden.bs.modal', function () {
            showInstructions();
          });
        } else {
          showInstructions();
        }
      }
    });

    return App;
  })();

  // class BlocklyApp extends App
  var BlocklyApp = (function(_super) {
    __extends(BlocklyApp, _super);

    // Must have a constructor
    function BlocklyApp(opts) {
      BlocklyApp.__super__.constructor.apply(this, arguments);

      return this;
    }

    $.extend(BlocklyApp.prototype, {
      startBlockly: function(dom) {
        this.containerId = dom.id;

        var _this = this;
        this.loadAssets().then(function() {
          window[_this.app + 'Main'](_this);
        });
      },

      loadAssets: function() {
        this.loadStyle('common');
        this.loadStyle(this.app);

        var promise;
        if (this.droplet) {
          this.loadStyle('droplet/droplet.min');
          promise = this.loadSource('jsinterpreter/acorn_interpreter')()
            .then(this.loadSource('requirejs/require'))
            .then(this.loadSource('ace/ace'))
            .then(this.loadSource('ace/ext-language_tools'))
            .then(this.loadSource('droplet/droplet-full.min'));
        } else {
          promise = this.loadSource('blockly')()
            .then(this.loadSource('blockly_locale', this.locale));
        }
        return promise
          .then(this.loadSource('common' + this.pretty))
          .then(this.loadSource('common_locale', this.locale))
          .then(this.loadSource(this.app + '_locale', this.locale))
          .then(this.loadSource(this.app + this.pretty));
      },

      onInitialize: function() {
        window.startTiming('Puzzle', this.scriptPath, '');

        // Hide callouts when the function editor is closed (otherwise they jump to the top left corner)
        $(window).on('function_editor_closed', function() {
          $('.cdo-qtips').qtip('hide');
        });

        this.createCallouts();
        if (window.wrapExistingClipPaths && window.handleClipPathChanges) {
          wrapExistingClipPaths();
          handleClipPathChanges();
        }

        $('#reference_area').show();

        BlocklyApp.__super__.onInitialize.apply(this, arguments);
      },

      createCallouts: function() {
        $.fn.qtip.zindex = 500;

        this.callouts && this.callouts.every(function(callout) {
          var selector = callout.element_id; // jquery selector.
          if ($(selector).length === 0 && !callout.on) {
            return true;
          }

          var defaultConfig = {
            content: {
              text: callout.localized_text,
              title: {
                button: $('<div class="tooltip-x-close"/>')
              }
            },
            style: {
              classes: "",
              tip: {
                width: 20,
                height: 20
              }
            },
            position: {
              my: "bottom left",
              at: "top right"
            },
            hide: {
              event: 'click mousedown touchstart'
            },
            show: false // don't show on mouseover
          };

          var customConfig = $.parseJSON(callout.qtip_config);
          var config = $.extend(true, {}, defaultConfig, customConfig);
          config.style.classes = config.style.classes.concat(" cdo-qtips");

          function reverseDirection(token) {
            if (/left/i.test(token)) {
              token = 'right';
            } else if (/right/i.test(token)) {
              token = 'left';
            }
            return token;
          }

          function reverseCallout(position) {
            position = position.split(/\s+/);
            var a = position[0];
            var b = position[1];
            return reverseDirection(a) + reverseDirection(b);
          }

          // Reverse callouts in RTL mode
          if (Blockly.RTL) {
            config.position.my = reverseCallout(config.position.my);
            config.position.at = reverseCallout(config.position.at);
            if (config.position.adjust) {
              config.position.adjust.x *= -1;
            }
          }

          if (callout.on) {
            window.addEventListener(callout.on, function() {
              if (!callout.seen && $(selector).length > 0) {
                callout.seen = true;
                $(selector).qtip(config).qtip('show');
              }
            });
          } else {
            $(selector).qtip(config).qtip('show');
          }

          return true;
        });
      }
    });

    return BlocklyApp;
  })(App);

  // class UnpluggedApp extends App
  var UnpluggedApp = (function(_super) {
    __extends(UnpluggedApp, _super);

    // Must have a constructor
    function UnpluggedApp(opts) {
      UnpluggedApp.__super__.constructor.apply(this, arguments);

      return this;
    }

    $.extend(UnpluggedApp.prototype, {
      // No custom overrides yet
    });

    return UnpluggedApp;
  })(App);

  // Exports:
  window.BlocklyApp = BlocklyApp;
  window.UnpluggedApp = UnpluggedApp;

}).call(this);