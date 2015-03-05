// LevelContainer user={}
components.LevelContainer = React.createClass({
  getInitialState: function() {
    return { app: null };
  },

  render: function() {
    var app = this.state.app;

    // If the level has loaded, display it
    if (app instanceof UnpluggedApp)
      return <components.UnpluggedLevel user={this.props.user} app={app} />;
    else if (app instanceof BlocklyApp)
      return <div key="blockly" id="appcontainer" />;

    // Otherwise display the loader-progress
    return (
      <div id="appcontainer">
        <div className="loading" />
        <div className="slow_load">
          <div>{I18N.slow_loading}</div>
          <a href="javascript: location.reload();">{I18N.try_reloading}</a>
        </div>
      </div>
    );
  },

  componentDidMount: function() {
    var dom = this.getDOMNode();

    // Show the slow-loading warning if it takes more than 10 seconds to initialize
    setTimeout(function() {
      $(dom).find('.slow_load').show();
    }, 10000);

    // When the levelStore gets data, update blockly
    window.levelStore.subscribe(this.onNewLevel); // React.createClass auto-binds
  },

  componentDidUpdate: function() {
    var app = this.state.app;

    // BlocklyApp is not implemented as a React component so we have to do something a bit tricky
    if (app instanceof BlocklyApp) {
      // Render a blockly app on top of our DOM
      app.startBlockly(this.getDOMNode());
    }
  },

  onNewLevel: function(data) {
    var opts = data.level;

    // Create .scriptPath that's used for tracking metrics on a live URL
    opts.scriptPath = Frame.linkTo({
      script: data.stage.script_name,
      stage: data.stage.position,
      level: data.level.position
    }, true);
    opts.stage = data.stage;
    opts.script_name = data.stage.script_name;
    opts.level.stage = data.stage.position;
    opts.level.stage_name = data.stage.name;

    // Determine which level app to render
    switch (opts.app) {
      case 'unplugged':

        this.setState({
          app: new UnpluggedApp(opts)
        });
        break;

      case 'multi':
      case 'Multi':
      case 'match':
      case 'Match':
        // TODO OFFLINE: Convert these level types
        break;

      case 'maze':
      case 'jigsaw':
      case 'bounce':
      case 'turtle':
      case 'flappy':
      case 'unplug':
      case 'studio':
      default:
        // Store this because level.id gets overwritten by the DIV id inside blockly somewhere
        opts.level_id = opts.level.id;

        // BaseUrl must be an absolute path.
        opts.baseUrl = Frame.getAbsolutePath('/blockly/');

        this.setState({
          app: new BlocklyApp(opts)
        });
        break;
    }
  }
});
