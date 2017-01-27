# intern-systemjs-loader

This package provides a wrapper around the SystemJS module loader so that it can
be used with Intern. It hooks the loader to provide some of Intern/Dojo's
hybrid plugin-modules. Transpilers such as Babel or TypeScript can be configured
to enable writing tests and source files without requiring a pre-compile step.

This loader is a work-in-progress and not all reporters/configuration options
have been thoroughly tested.

### Installing and configuration

Install with NPM:

```
npm install intern-systemjs-loader
```

Then, modify your Intern configuration to use the loader:

```
    loaders: {
      'host-node': require.nodeRequire && require.nodeRequire.resolve('intern-systemjs-loader'),
      'host-browser': 'node_modules/intern-systemjs-loader/main.js'
    }
```

### Using Babel to transform ES modules and JSX code

Simply `npm install systemjs-plugin-babel`, then specify the `loaderOptions`
configuration in your `intern.js` file:

```
    loaderOptions: {
        transpiler: 'plugin-babel',
    },

    excludeInstrumentation: true
```

Disabling instrumentation of any ES modules is necessary as Istanbul fails hard
if it tries to cover them.

Several modules, including _plugin-babel_, _react_ and _fbjs_ are pre-mapped to
their respective locations within node_modules.  This is done for convenience,
they can be overridden using the `map` and `packages` configuration options.
