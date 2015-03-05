components.HeaderPopupKey = React.createClass({
  render: function() {
    return (
        <div className="key" style={{ clear: 'both' }}>
          <dl>
            <dt><span className="puzzle_outer_level">
              <a className="level_link not_tried"><span className="puzzle-number">1</span></a>
            </span></dt>
            <dd>{I18N.progress.not_started}</dd>
          </dl><dl>
          <dt><span className="puzzle_outer_level">
            <a className="level_link attempted"><span className="puzzle-number">1</span></a>
          </span></dt>
          <dd>{I18N.progress.in_progress}</dd>
        </dl><dl>
          <dt><span className="puzzle_outer_level">
            <a className="level_link passed"><img src={Frame.assetUrl('white-checkmark.png')} /></a>
          </span></dt>
          <dd>{I18N.progress.completed_too_many_blocks}</dd>
        </dl><dl>
          <dt><span className="puzzle_outer_level">
            <a className="level_link perfect"><img src={Frame.assetUrl('white-checkmark.png')} /></a>
          </span></dt>
          <dd>{I18N.progress.completed_perfect}</dd>
        </dl><dl>
          <dt><span className="puzzle_outer_level puzzle_outer_assessment">
            <a className="level_link not_tried"><span className="puzzle-number">1</span></a>
          </span></dt>
          <dd>{I18N.progress.assessment}</dd>
        </dl>
        </div>
    );
  }
});
