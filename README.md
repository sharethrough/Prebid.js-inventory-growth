[![Percentage of issues still open](http://isitmaintained.com/badge/open/prebid/Prebid.js.svg)](https://isitmaintained.com/project/prebid/Prebid.js "Percentage of issues still open")
[![Coverage Status](https://coveralls.io/repos/github/prebid/Prebid.js/badge.svg?branch=master)](https://coveralls.io/github/prebid/Prebid.js?branch=master)

# Prebid.js

> A free and open source library for publishers to quickly implement header bidding.

This README is for developers who want to contribute to Prebid.js.
Additional documentation can be found at [the Prebid.js documentation homepage](https://docs.prebid.org/prebid/prebidjs.html).
Working examples can be found in [the developer docs](https://prebid.org/dev-docs/getting-started.html).

Prebid.js is open source software that is offered for free as a convenience. While it is designed to help companies address legal requirements associated with header bidding, we cannot and do not warrant that your use of Prebid.js will satisfy legal requirements. You are solely responsible for ensuring that your use of Prebid.js complies with all applicable laws.  We strongly encourage you to obtain legal advice when using Prebid.js to ensure your implementation complies with all laws where you operate.

**Table of Contents**

- [Usage](#Usage)
- [Install](#Install)
- [Build](#Build)
- [Run](#Run)
- [Contribute](#Contribute)

<a name="Usage"></a>

## Usage (as a npm dependency)

**Note**: versions prior to v10 required some Babel plugins to be configured when used as an NPM dependency -
refer to [v9 README](https://github.com/prebid/Prebid.js/blob/9.43.0/README.md). See also [customize build options](#customize-options)

```javascript
import pbjs from 'prebid.js';
import 'prebid.js/modules/rubiconBidAdapter'; // imported modules will register themselves automatically with prebid
import 'prebid.js/modules/appnexusBidAdapter';
pbjs.processQueue();  // required to process existing pbjs.queue blocks and setup any further pbjs.queue execution

pbjs.requestBids({
  ...
})
```

You can import just type definitions for every module from `types.d.ts`, and for the `pbjs` global from `global.d.ts`:

```typescript
import 'prebid.js/types.d.ts';
import 'prebid.js/global.d.ts';
pbjs.que.push(/* ... */)
```

Or, if your Prebid bundle uses a different global variable name:

```typescript
import type {PrebidJS} from 'prebid.js/types.d.ts';
declare global {
    interface Window {
        myCustomPrebidGlobal: PrebidJS;
    }
}
```

<a id="customize-options"></a>

### Customize build options

If you're using Webpack, you can use the `prebid.js/customize/webpackLoader` loader to set the following options:

| Name | Type | Description | Default | 
| ---- | ---- | ----------- | ------- |
| globalVarName | String | Prebid global variable name | `"pbjs"` | 
| defineGlobal | Boolean | If false, do not set a global variable | `true` | 
| distUrlBase |  String | Base URL to use for dynamically loaded modules (e.g. debugging-standalone.js) | `"https://cdn.jsdelivr.net/npm/prebid.js/dist/chunks/"` |

For example, to set a custom global variable name:

```javascript
// webpack.conf.js
module.exports = {
  module: {
    rules: [
      {
        loader: 'prebid.js/customize/webpackLoader',
        options: {
          globalVarName: 'myCustomGlobal'
        }
      },
    ]
  }
}
```


<a name="Install"></a>

## Install



    $ git clone https://github.com/prebid/Prebid.js.git
    $ cd Prebid.js
    $ npm ci

*Note:* You need to have `NodeJS` 12.16.1 or greater installed.

*Note:* In the 1.24.0 release of Prebid.js we have transitioned to using gulp 4.0 from using gulp 3.9.1.  To comply with gulp's recommended setup for 4.0, you'll need to have `gulp-cli` installed globally prior to running the general `npm ci`.  This shouldn't impact any other projects you may work on that use an earlier version of gulp in its setup.

If you have a previous version of `gulp` installed globally, you'll need to remove it before installing `gulp-cli`.  You can check if this is installed by running `gulp -v` and seeing the version that's listed in the `CLI` field of the output.  If you have the `gulp` package installed globally, it's likely the same version that you'll see in the `Local` field.  If you already have `gulp-cli` installed, it should be a lower major version (it's at version `2.0.1` at the time of the transition).

To remove the old package, you can use the command: `npm rm gulp -g`

Once setup, run the following command to globally install the `gulp-cli` package: `npm install gulp-cli -g`


<a name="Build"></a>

## Build for Development

To build the project on your local machine we recommend, running:

    $ gulp serve-and-test --file <spec_file.js>

This will run testing but not linting. A web server will start at `http://localhost:9999` serving from the project root and generates the following files:

+ `./build/dev/prebid.js` - Full source code for dev and debug
+ `./build/dev/prebid.js.map` - Source map for dev and debug
+ `./build/dev/prebid-core.js`
+ `./build/dev/prebid-core.js.map`


Development may be a bit slower but if you prefer linting and additional watch files you can also still run just:

    $ gulp serve


### Build Optimization

The standard build output contains all the available modules from within the `modules` folder.  Note, however that there are bid adapters which support multiple bidders through aliases, so if you don't see a file in modules for a bid adapter, you may need to grep the repository to find the name of the module you need to include.

You might want to exclude some/most of them from the final bundle.  To make sure the build only includes the modules you want, you can specify the modules to be included with the `--modules` CLI argument.

For example, when running the serve command: `gulp serve --modules=openxBidAdapter,rubiconBidAdapter,sovrnBidAdapter`

Building with just these adapters will result in a smaller bundle which should allow your pages to load faster.

**Build standalone prebid.js**

- Clone the repo, run `npm ci`
- Then run the build:

        $ gulp build --modules=openxBidAdapter,rubiconBidAdapter,sovrnBidAdapter

Alternatively, a `.json` file can be specified that contains a list of modules you would like to include.

    $ gulp build --modules=modules.json

With `modules.json` containing the following
```json modules.json
[
  "openxBidAdapter",
  "rubiconBidAdapter",
  "sovrnBidAdapter"
]
```

**Build prebid.js using npm for bundling**

In case you'd like to explicitly show that your project uses `prebid.js` and want a reproducible build, consider adding it as an `npm` dependency.

- Add `prebid.js` as a `npm` dependency of your project: `npm install prebid.js`
- Run the `prebid.js` build under the `node_modules/prebid.js/` folder

        $ gulp build --modules=path/to/your/list-of-modules.json

Most likely your custom `prebid.js` will only change when there's:

- A change in your list of modules
- A new release of `prebid.js`

Having said that, you are probably safe to check your custom bundle into your project.  You can also generate it in your build process.

**Build once, bundle multiple times**

If you need to generate multiple distinct bundles from the same Prebid version, you can reuse a single build with:

```
gulp build
gulp bundle --tag one --modules=one.json
gulp bundle --tag two --modules=two.json
```

This generates slightly larger files, but has the advantage of being much faster to run (after the initial `gulp build`). It's also the method used by [the Prebid.org download page](https://docs.prebid.org/download.html).

<a name="Run"></a>

### Excluding particular features from the build

Since version 7.2.0, you may instruct the build to exclude code for some features - for example, if you don't need support for native ads:

```
gulp build --disable NATIVE --modules=openxBidAdapter,rubiconBidAdapter,sovrnBidAdapter # substitute your module list
```

Features that can be disabled this way are:

 - `VIDEO` - support for video bids;
 - `NATIVE` - support for native bids;
- `UID2_CSTG` - support for UID2 client side token generation (see [Unified ID 2.0](https://docs.prebid.org/dev-docs/modules/userid-submodules/unified2.html))
- `GREEDY` - disables the use blocking, "greedy" promises within Prebid (see [note](#greedy-promise)).
- `LOG_NON_ERROR` - support for non-error console messages. (see [note](#log-features))
- `LOG_ERROR` - support for error console messages (see [note](#log-features))

`GREEDY` is disabled and all other features are enabled when no features are explicitly chosen. Use `--enable GREEDY` on the `gulp build` command or remove it from `disableFeatures` to restore the original behavior. If you disable any feature, you must explicitly also disable `GREEDY` to get the default behavior on promises.

<a id="greedy-promise"></a>

#### Greedy promises

When `GREEDY` is enabled, Prebid attempts to hold control of the main thread when possible, using a [custom implementation of `Promise`](https://github.com/prebid/Prebid.js/blob/master/libraries/greedy/greedyPromise.js) that does not submit callbacks to the scheduler once the promise is resolved (running them immediately instead).
Disabling this behavior instructs Prebid to use the standard `window.Promise` instead; this has the effect of breaking up task execution, making them slower overall but giving the browser more chances to run other tasks in between, which can improve UX.         

You may also override the `Promise` constructor used by Prebid through `pbjs.Promise`, for example:

```javascript
var pbjs = pbjs || {};
pbjs.Promise = myCustomPromiseConstructor;
```

<a id="log-features"></a>

#### Logging

Disabling `LOG_NON_ERROR` and `LOG_ERROR` removes most logging statements from source, which can save on bundle size. Beware, however, that there is no test coverage with either of these disabled. Turn them off at your own risk.

Disabling logging — especially `LOG_ERROR` — also makes debugging more difficult. Consider building a separate version with logging enabled for debugging purposes.

We suggest running the build with logging off only if you are able to confirm a real world metric improvement via a testing framework. Using this build without such a framework may result in unexpectedly worse performance.

## Unminified code

You can get a version of the code that's unminified for debugging with `build-bundle-dev`:

```bash
gulp build-bundle-dev --modules=bidderA,module1,...
```

The results will be in build/dev/prebid.js.

## ES5 Output Support

For compatibility with older parsers or environments that require ES5 syntax, you can generate ES5-compatible output using the `--ES5` flag:

```bash
gulp build-bundle-dev --modules=bidderA,module1,... --ES5
```

This will:
- Transpile all code to ES5 syntax using CommonJS modules
- Target browsers: IE11+, Chrome 50+, Firefox 50+, Safari 10+
- Ensure compatibility with older JavaScript parsers

**Note:** Without the `--ES5` flag, the build will use modern ES6+ syntax by default for better performance and smaller bundle sizes.

## Test locally

To lint the code:

```bash
gulp lint
```

To lint and only show errors

```bash
gulp lint --no-lint-warnings
```

To run the unit tests:

```bash
gulp test
```

To run the unit tests for a particular file (example for pubmaticBidAdapter_spec.js):
```bash
gulp test --file "test/spec/modules/pubmaticBidAdapter_spec.js" --nolint
```

To generate and view the code coverage reports:

```bash
gulp test-coverage
gulp view-coverage
```

Local end-to-end testing can be done with:

```bash
gulp e2e-test --local
```

For Prebid.org members with access to BrowserStack, additional end-to-end testing can be done with:

```bash
gulp e2e-test --host=test.localhost
```

To run these tests, the following items are required:
- setup an alias of localhost in your `hosts` file (eg `127.0.0.1  test.localhost`); note - you can use any alias.  Use this alias in the command-line argument above.
- access to [BrowserStack](https://www.browserstack.com/) account.  Assign the following variables in your bash_profile:
```bash
export BROWSERSTACK_USERNAME='YourUserNameHere'
export BROWSERSTACK_ACCESS_KEY='YourAccessKeyHere'
```
You can get these BrowserStack values from your profile page.

For development:

```javascript
(function() {
    var d = document, pbs = d.createElement('script'), pro = d.location.protocol;
    pbs.type = 'text/javascript';
    pbs.src = ((pro === 'https:') ? 'https' : 'http') + './build/dev/prebid.js';
    var target = document.getElementsByTagName('head')[0];
    target.insertBefore(pbs, target.firstChild);
})();
```

For deployment:

```javascript
(function() {
    var d = document, pbs = d.createElement('script'), pro = d.location.protocol;
    pbs.type = 'text/javascript';
    pbs.src = ((pro === 'https:') ? 'https' : 'http') + './build/dist/prebid.js';
    var target = document.getElementsByTagName('head')[0];
    target.insertBefore(pbs, target.firstChild);
})();
```

Build and run the project locally with:

```bash
gulp serve
```

This runs `lint` and `test`, then starts a web server at `http://localhost:9999` serving from the project root.
Navigate to your example implementation to test, and if your `prebid.js` file is sourced from the `./build/dev`
directory you will have sourcemaps available in your browser's developer tools.

To run the example file, go to:

+ `http://localhost:9999/integrationExamples/gpt/hello_world.html`

As you make code changes, the bundles will be rebuilt and the page reloaded automatically.

<a name="Contribute"></a>

## Contribute

Many SSPs, bidders, and publishers have contributed to this project. [Hundreds of bidders](https://github.com/prebid/Prebid.js/tree/master/modules) are supported by Prebid.js.

For guidelines, see [Contributing](./CONTRIBUTING.md).

Our PR review process can be found [here](https://github.com/prebid/Prebid.js/tree/master/PR_REVIEW.md).

### Add a Bidder Adapter

To add a bidder adapter module, see the instructions in [How to add a bidder adapter](https://docs.prebid.org/dev-docs/bidder-adaptor.html).

### Code Quality

Code quality is defined by `.eslintrc` and errors are reported in the terminal.

If you are contributing code, you should [configure your editor](http://eslint.org/docs/user-guide/integrations#editors) with the provided `.eslintrc` settings.

### Unit Testing with Karma

        $ gulp test --watch --browsers=chrome

This will run tests and keep the Karma test browser open. If your `prebid.js` file is sourced from the `./build/dev` directory you will also have sourcemaps available when using your browser's developer tools.

+ To access the Karma debug page, go to `http://localhost:9876/debug.html`

+ For test results, see the console

+ To set breakpoints in source code, see the developer tools

Detailed code coverage reporting can be generated explicitly with

        $ gulp test --coverage

The results will be in

        ./build/coverage

*Note*: Starting in June 2016, all pull requests to Prebid.js need to include tests with greater than 80% code coverage before they can be merged.  For more information, see [#421](https://github.com/prebid/Prebid.js/issues/421).

For instructions on writing tests for Prebid.js, see [Testing Prebid.js](https://prebid.org/dev-docs/testing-prebid.html).

### Supported Browsers

Prebid.js is supported on IE11 and modern browsers until 5.x. 6.x+ transpiles to target >0.25%; not dead; not Opera Mini; not IE11.

### Governance
Review our governance model [here](https://github.com/prebid/Prebid.js/tree/master/governance.md).
### END
