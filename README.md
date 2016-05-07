# intern-systemjs-loader

This package provides a wrapper around the SystemJS module loader so that it can
be used with Intern. It hooks the loader to provide some of Intern/Dojo's
hybrid plugin-modules. Transpilers such as Babel or TypeScript can be configured
to enable writing tests and source files without requiring a pre-compile step.

This loader is a work-in-progress and currently only works in Intern's _client_
environment.

## Installing and configuration

Install with NPM:

```
npm install intern-systemjs-loader
```

Then, modify your Intern configuration to use the loader:

```
    loaders: {
      'host-browser': 'node_modules/intern-systemjs-loader/main.js'
    }
```

## Using Babel to transpile ES modules

Simply `npm install systemjs-plugin-babel`, then specify the `loaderOptions`
configuration in your `intern.js` file:

```
    loaderOptions: {
        transpiler: 'plugin-babel',

        map: {
            'plugin-babel': '/node_modules/systemjs-plugin-babel/plugin-babel.js',
            'systemjs-babel-build': '/node_modules/systemjs-plugin-babel/systemjs-babel-browser.js'
        }
    }
```
