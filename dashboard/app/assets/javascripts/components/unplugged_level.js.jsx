// UnpluggedLevel user={} app={}
components.UnpluggedLevel = React.createClass({
  render: function () {
    var user = this.props.user || {};
    var level = this.props.app || {};
    var stage = level.stage || {};

    if (!level) {
      return false;
    }

    var video_download;
    if (level.video && level.video.download) {
      video_download = <a className="video-download btn pull-right" href={level.video.download}>{I18N.video.download}</a>;
    }

    var lesson_plans, pegasus_lessons;
    var is_student = user.student;
    if (!is_student) {
      if (stage.lesson_plan_html_url) {
        pegasus_lessons = (
            <div className="lesson-plan">
              <h2>{I18N.lesson_plan}</h2>
              <a className="btn pdf-button" href={stage.lesson_plan_html_url} target="_blank">{I18N.view_lesson_plan}</a>
              <a className="btn pdf-button" href={stage.lesson_plan_pdf_url} target="_blank">{I18N.pdf_download}</a>
            </div>
        );
      }

      if (level.pdfs) {
        lesson_plans = $.map(level.pdfs, (function (pdf) {
          return <a key={pdf.name} className="btn pull-right pdf-button" href={ Frame.getAbsolutePath(pdf.url) } target="_blank">{ pdf.name }</a>;
        }).bind(this));
      } else if (!pegasus_lessons) {
        lesson_plans = <a className="btn pull-right pdf-button disabled">{I18N.download_coming_soon}</a>;
      }
    }

    var video;
    if (level.video) {
      video = (
          <div className="video-container" />
      );
    } else {
      video = (
          <p className="coming-soon">{I18N.video_coming_soon}</p>
      );
    }

    return (
        <div className="unplugged">
          <h2>{level.title}</h2>
          <p>{level.desc}</p>
          <div className="video-section">
            <a className="btn btn-primary next-stage" onClick={this.onNextClick}>{I18N.next_stage}</a>
            { video_download }
            { lesson_plans }
            <div className="clear" />
            { video }
          </div>
          <div className="clear" />
          { pegasus_lessons }
        </div>
    );

  },

  componentDidMount: function () {
    var el = $('.video-container');
    if (el.length) {
      // TODO: Is the video ever anything but 800px?  (page_width was coming from server)
      el.html('');
      el.append(createVideoWithFallback(this.props.app.video, 800, 800 / (16 / 9)))
    }
  },

  onNextClick: function () {
    var app = this.props.app;

    // Some of these parameters may not be necessary.
    app.onAttempt({
      app: 'unplug',
      level: this.props.app.level_num,
      pass: true,
      result: true,
      testResult: 100,
      onComplete: app.onContinue // It's already bound to app
    });
  }

});
