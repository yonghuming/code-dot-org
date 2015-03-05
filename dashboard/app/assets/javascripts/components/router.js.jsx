// It's not really a JSX, but eventually it would be.
(function() {

  // class UIRouter: this is an incredibly simple router with our routes baked into it.
  // This will be completely replaced when we choose a router.
  var UIRouter = (function() {

    function UIRouter() { }

    UIRouter.prototype.route = function() {
      var re, parts, url = window.location.pathname;

      // Route: /:script_name/:level_position
      re = /^\/(hoc|flappy)\/(\d+)$/i;
      parts = url.match(re);
      if (parts) {
        levelStore.load({
          script_name: parts[1],
          level_id: parts[2]
        });

        return;
      }

      // Route: /s/:script_name/stage/:stage_position/level/:level_position
      re = /^\/s\/(.+)\/stage\/(\d+)\/puzzle\/(\d+)$/i;
      parts = url.match(re);
      if (parts) {
        levelStore.load({
          script_name: parts[1],
          stage_id: parts[2],
          level_id: parts[3]
        });

        return;
      }

      // Right now, the static is a fixed route
      if (window.Frame.isSinglePage) {
        var params = Frame.queryParams() || {
          script: '20-hour',
          stage: 3,  // TODO: Default route
          level: 3
        };

        this.script_name = params.script;
        levelStore.load({
          script_name: params.script,
          stage_id: params.stage,
          level_id: params.level
        });

        return;
      }

      // Unknown route
      return null;
    };

    return UIRouter;
  })();

  window.UIRouter = UIRouter;

})();
