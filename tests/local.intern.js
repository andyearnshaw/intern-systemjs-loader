define({
	// The port on which the instrumenting proxy will listen
	proxyPort: 9000,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://localhost:9000/',

	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
	// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
	// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
	// automatically
	capabilities: {
		'selenium-version': '2.44.0'
	},

    reporters: typeof window !== 'undefined' ? ['html'] : ['Runner', 'LcovHtml'],

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: 'phantomjs' }
		// { browserName: 'internet explorer', version: '11', platform: 'Windows 8.1' },
		// { browserName: 'internet explorer', version: '10', platform: 'Windows 8' },
		// { browserName: 'internet explorer', version: '9', platform: 'Windows 7' },
		// { browserName: 'firefox', version: '28', platform: [ 'OS X 10.9', 'Windows 7', 'Linux' ] },
		// { browserName: 'chrome', version: '34', platform: [ 'OS X 10.9', 'Windows 7', 'Linux' ] },
		// { browserName: 'safari', version: '6', platform: 'OS X 10.8' },
		// { browserName: 'safari', version: '7', platform: 'OS X 10.9' }
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,

	// Name of the tunnel class to use for WebDriver tests
	//tunnel: 'SauceLabsTunnel',
	tunnel: 'NullTunnel',

    loaders: {
        'host-node': require.nodeRequire && require.nodeRequire('path').resolve('main.js'), // relative to package.json
        'host-browser': '../main.js' // relative to this file
    },

	// Configuration options for the module loader; any AMD configuration options supported by the specified AMD loader
	// can be used here
	loaderOptions: {
        transpiler: 'plugin-babel',

        map: {
            'plugin-babel': 'node_modules/systemjs-plugin-babel/plugin-babel.js',
            'systemjs-babel-build': 'node_modules/systemjs-plugin-babel/systemjs-babel-browser.js',
        },

		// Packages that should be registered with the loader in each testing environment
		// packages: [ { name: 'vpaid', location: './src/vpaid' } ]
	},

	// Non-functional test suite(s) to run in each browser
	suites: [ 'tests/sample.spec.js' ],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [ /* 'myPackage/tests/functional' */ ],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: true, // /^(?:tests|node_modules|build|resources)\//
});

