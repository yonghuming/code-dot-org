components.SignInButton = React.createClass({
  getInitialState: function() {
    return { popped: false };
  },

  render: function() {
    var user = this.props.user || {};

    if (user) {
      var greeting = I18N.nav.user.label.replace("***", user.username);

      var menu;
      if (!this.state.popped) {
        arrow = <span className="user_menu_glyph">&#x25BC;</span>; // ▼
      } else {
        arrow = <span className="user_menu_glyph">&#x25B2;</span>; // ▲

        options = [];
        if (user.teacher)
          options.push(<a key="dashboard" href={user.actions.dashboard}>{I18N.nav.user.classroom}</a>);
        options.push(<a key="root" href={Frame.rootUrl}>{I18N.nav.user.stats}</a>);
        options.push(<a key="settings" href={user.actions.settings}>{I18N.nav.user.settings}</a>);
        if (user.teacher && (user.teacher_prize || user.bonus_prize))
          options.push(<a key="prize" href={user.actions.prizes}>{I18N.nav.user.prizes}</a>);
        options.push(<a key="signout" href={user.actions.signout}>{I18N.nav.user.logout}</a>);

        menu = (
            <div style={{ position: 'relative', top: 3 }}>
              <div className="user_options">
                { options }
              </div>
            </div>
        );
      }

      return (
          <span className="user_menu">
            <div className="header_button header_user" onClick={this.onOpenClick}>
              <span>{greeting} </span>
              { arrow }
            </div>
            { menu }
          </span>
      );
    } else if (!Frame.isSinglePage) {
      return (
          <div className="header_button header_user">
            <a href={ Frame.linkTo({ signin: true }) } id="signin_button" className="button-signin">
              {I18N.nav.user.signin}
            </a>
          </div>
      );
    } else {
      return false;
    }
  },

  componentDidUpdate: function() {
    if (this.state.popped) {
      // Catch clicks anywhere else and close the popup
      $(document).on('click', this.onModalClick);
    } else {
      $(document).off('click', this.onModalClick);
    }
  },

  onOpenClick: function(ev) {
    this.setState({ popped: !this.state.popped });
  },

  onModalClick: function(ev) {
    // Don't count a click on the button - that's handled in onOpenClick
    var el = $(ev.target).closest('.header_button');
    if (el.length)
      return;

    this.setState({ popped: false });
  }

});
