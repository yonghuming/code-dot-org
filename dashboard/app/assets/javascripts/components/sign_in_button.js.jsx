components.SignInButton = React.createClass({
  getInitialState: function() {
    return { popped: false };
  },

  render: function() {
    var P = this.props || {};
    var S = this.state || {};

    if (P.user) {
      var greeting = I18N.nav.user.label.replace("***", P.user.username);

      var menu;
      if (!S.popped) {
        arrow = <span className="user_menu_glyph">&#x25BC;</span>; // ▼
      } else {
        arrow = <span className="user_menu_glyph">&#x25B2;</span>; // ▲

        options = [];
        if (P.user.teacher)
          options.push(<a key="dashboard" href={P.user.actions.dashboard}>{I18N.nav.user.classroom}</a>);
        options.push(<a key="root" href={Frame.rootUrl}>{I18N.nav.user.stats}</a>);
        options.push(<a key="settings" href={P.user.actions.settings}>{I18N.nav.user.settings}</a>);
        if (P.user.teacher && (P.user.teacher_prize || P.user.bonus_prize))
          options.push(<a key="prize" href={P.user.actions.prizes}>{I18N.nav.user.prizes}</a>);
        options.push(<a key="signout" href={P.user.actions.signout}>{I18N.nav.user.logout}</a>);

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
