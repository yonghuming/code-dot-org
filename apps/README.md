# The Apps Package

The **Apps Package** contains most of our client-side JavaScript, particularly the source code for the [Blockly](https://code.google.com/p/blockly/) based 20 hour curriculum, Hour of Code, and our Droplet-based levels (including App Lab). Information about Blockly can be found in the [wiki](https://code.google.com/p/blockly/w/list).

Blockly is a web-based, graphical programming editor. Users can drag blocks together to build an application. No typing required. Credit goes to these awesome [developers](https://code.google.com/p/blockly/wiki/Credits#Engineers)
and a small army of [translators](https://code.google.com/p/blockly/wiki/Credits#Translators).

- [Quick Start](#quick-start)
- [Contributing](#contributing)

## Quick Start

### Installing Apps

```
cd apps

# Machine setup (OSX with Homebrew)
brew install node
npm install -g grunt-cli

# Perform first full build
npm install
npm run build
```

### Seeing your development version of Apps in Dashboard

1. To make your changes show up in dashboard, do the following after the first time you build apps:
  - Set `use_my_apps: true` to your locals.yml config file.
  - Run `rake package:apps:symlink` to pick up the configuration change.
  - If you are currently running dashboard, stop and restart dashboard-server.

1. If you find your changes are not showing up within dashboard, you may have accidentally reverted your symlink to point to the pre-built version of apps (e.g. when switching branches or stashing changes). To check your symlink, run:
```
> ls -l dashboard/public/blockly
```
and look for something like:
```
lrwxr-xr-x  1 laurel  501  12 Apr 27 13:00 dashboard/public/blockly -> apps/build/package
```
If the symlink is in place, then as you rebuild apps, your results should show up in Dashboard.  If not, run through step 1 again.

### Building during development

#### Full build

To run a full development build (minus localization):

```
npm run build
```

* `npm run build` builds a 'debug' version with more readable javascript
* `npm run build -- --app=maze` builds a 'debug' version of only the maze app
* `npm run build:dist` builds a minified version suitable for production
* `npm run clean` will clean the build directory

See also: [Full build with blockly-core](#full-build-with-blockly-core-changes)

#### Running with live-reload server

```
npm start
```

This will perform an initial build, then serve and open a playground with a few sample blockly apps at [http://localhost:8000](http://localhost:8000) and live-reload changes to apps.  If you followed the steps above for seeing your development version in Dashboard, the rebuilt apps code will be immediately available to Dashboard too.

Caveats:
* The live-reload server does not pick up changes to blockly-core.  For that, see [Full build with blockly-core](#full-build-with-blockly-core-changes).
* If you get `Error: EMFILE, too many open files` while running the live-reload server (common on OSX) try increasing the OS open file limit by running `ulimit -n 1024` (and adding it to your `.bashrc`).

##### Rebuild only a single app

To have grunt rebuild only a single app, use the `--app` parameter:

```
npm start -- --app=maze
```

##### Rebuild with custom polling interval

The `grunt watch` task when run with a low filesystem polling interval is [known to cause high CPU usage](https://github.com/gruntjs/grunt-contrib-watch/issues/145) on OS X.

To set a custom polling interval, use the `--delay` parameter:

```
npm start -- --delay=5000
```

Since the longer the polling is, the longer the delay before builds can be, we'll try to keep the polling interval a happy medium. The default polling interval is set to 700ms which as of 2/24/2016 uses roughly 10% CPU on a Macbook Pro.

##### Rebuild without live reload

To have grunt rebuild on changes but not run an express server, you can use the constituent commands:

```
MOOC_DEV=1 grunt build watch
```

#### Running tests

```
npm test
```
* If you see an error like `ReferenceError: Blockly is not defined` or notes about missing npm packages, double check that you've run `grunt build` before `grunt test`
* Right now, the tests require a full/production build to pass.  Failures like `Cannot set property 'imageDimensions_' of undefined` in setup steps may indicate that you are testing against a debug build.
* These tests will also be run via Circle CI when you create a pull request

To run an individual test, use the `--entry` option with `npm run test:entry` to target a file:

```
npm run test:entry -- --entry ./test/unit/gridUtilsTest.js
```

To rerun tests automatically on every file change, set the environment variable
`MOOC_WATCH=1`:

```
MOOC_WATCH=1 npm run test:unit
```

This will work on any of the test commands.

To debug tests, your best bet is to run them in Chrome. Keep in mind that there
can be subtle differences between Chrome and PhantomJS, so after fixing your
test in Chrome, make sure it still works in PhantomJS. To run the tests in
Chrome, use the `MOOC_BROWSER` environment variable in conjunction with `MOOC_WATCH`:

```
MOOC_BROWSER=Chrome MOOC_WATCH=1 npm run test:unit
```

A new chrome browser window will open where the tests will be running. You can
click on the Debug button to open a new tab where you can then open the
developer console to see everything that is happening. If you don't see the new
chrome browser window, it may have opened *behind* your other windows.

- You can add new test files as /test/*Tests.js, see `/test/feedbackTests.js` as an example of adding a mock Blockly instance

#### Full build with blockly-core changes

1. Check out [blockly-core](https://github.com/code-dot-org/blockly-core/) as a sibling directory to blockly.
1. `./build_with_core.sh debug`
  * The `debug` flag builds debug versions of both blockly-core and blockly, suitable for debugging
1. `grunt dev`

### Localization

It's especially important to test your changes with localization when modifying layouts. We support
right-to-left languages and have some special layout tweaks embedded in the CSS to support that.

Running a full localization build can take several minutes. Since localization re-builds javascript files for many languages, the default build target locales are `en_us` and `en_ploc` (pseudolocalized).

Note: Using the live-reload server with localization builds is prone to the `Error: EMFILE, too many open files` problem.  See the `ulimit` fix [under the live-reload server heading](#running-with-live-reload-server).

#### Forwarding new strings on to CrowdIn

To get new strings localized using CrowdIn, we currently run a script in a private repository. Contact a code.org engineer to trigger an update.

### Adding a new npm package

To add a new package using npm, e.g., `lodash`, run: `npm i --save-dev lodash`

- `--save-dev` adds the dependency to node's package.json, freezing the current version
- Because the build process is done in dev mode, include dependencies as devDependencies rather than production dependencies

## Contributing

We'd love to have you join our group of contributors!

For notes on our pull process, where to find tasks to work on, etc., see the [Contributing Guide](https://github.com/code-dot-org/code-dot-org/blob/staging/CONTRIBUTING.md).

### Style Guide

- In general follow Google's javascript style [guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml).
- 80 character line length.
- 2 space indent.
- 4 space indent on long line breaks.
- `npm run lint` should report 0 warnings or errors.
- See our [project style guide](../STYLEGUIDE.md) for details.
