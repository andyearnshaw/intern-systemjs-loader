(function (global) {
    var realRequire, realDefine,
        nodeRequire = require,
        parentModule = typeof module !== 'undefined' && module.parent,
        slice = Array.prototype.slice,
        internBase = 'node_modules/intern',
        polyfillUrl = '/node_modules/systemjs/dist/system-polyfills.js',
        systemJSUrl = '/node_modules/systemjs/dist/system.src.js',
        requireQueue = [],
        defineQueue = [],
        configQueue = [
            [{
                pluginFirst: true,
                baseURL: nodeRequire ?  '' : '/',
                meta: {
                    'intern/*': { scriptLoad: true },
                    'dojo/*': { scriptLoad: true }
                },
                packages: {
                    'intern': { format: 'amd', defaultExtension: 'js' },
                    'dojo': { format: 'amd', defaultExtension: 'js' },
                    'fbjs': {
                        main: 'index.js',
                        defaultExtension: 'js',
                    },
                    'react': {
                        main: 'react.js',
                        defaultExtension: 'js',

                        map: {
                            'object-assign': 'node_modules/object-assign/index.js',
                        }
                    }
                },
                map: {
                    'dojo': 'node_modules/dojo',
                    'intern': internBase,
                    'intern/chai': internBase + '/browser_modules/chai/chai.js',

                    // These are required for transpiling
                    'react': 'node_modules/react',
                    'fbjs': 'node_modules/fbjs',
                    'systemjs-babel-build': 'node_modules/systemjs-plugin-babel/systemjs-babel-browser.js',
                    'plugin-babel': 'node_modules/systemjs-plugin-babel/plugin-babel.js'
                }
            }]
        ];

    function setHooks() {
        var normalize = SystemJS.normalize,
            hasMap = {
                'host-browser': !nodeRequire,
                'host-node': !!nodeRequire
            };

        function has(str) {
            return hasMap[str];
        }

        has.add = function (str, val) {
            hasMap[str] = val;
        };

        // dojo/has is both a function-returning module and a loader-plugin.
        // SystemJS doesn't support this, so we need to hack the behavior in.
        SystemJS.set('@intern-systemjs-loader:has', System.newModule({ __useDefault: true, default: has, }));
        SystemJS.set('@intern-systemjs-loader:undefined', System.newModule({ __useDefault: true }));
        SystemJS.set('@intern-systemjs-loader:node', System.newModule({
            fetch: function () { return ''; },
            instantiate: function (load) {
                // Offer a helpful message if someone tries to use this in the browser
                if (!parentModule || !parentModule.require) {
                    throw new ReferenceError('Node require not found (is this a browser?)');
                }

                return parentModule.require(load.address);
            }
        }));

        // Normalize "dojo/has" to either our hasPlugin or hasModule GUIDs depending on whether it's
        // required as a loader plugin or a module.
        SystemJS.normalize = function normalizeForIntern (name, parentName, parentAddress) {
            var current, split, target,
                // Matcher for `dojo/has!foo?bar:baz`, where bar or baz could also be a ternary condition
                matcher = /[^?]+(?=\?([^:]+)(?::(.+))?)/,
                hook = name.indexOf('dojo/has') === 0
                            || name.indexOf('./has') === 0 && parentName.split('/').slice(-2)[0] === 'dojo';

            // SystemJS erroneously thinks dojo/request/node is required by dojo/request in the browser even though it's
            // hidden by an if statement so the module can support both node and the browser.
            // Just point to our export undefined module for now.
            if (name.indexOf('./request/node') > -1 && parentName.indexOf('dojo/') > -1) {
                return '@intern-systemjs-loader:undefined';
            }

            if (hook) {
                // If a direct request the module, return the one we set earlier
                if (name.slice(-4) === '/has') {
                    return '@intern-systemjs-loader:has';
                }

                // Loop over the conditions to figure out which module to load (if any)
                target = name.slice(name.indexOf('!') + 1);
                while (current = matcher.exec(target)) {
                    target = has(current[0]) ? current[1] : current[2];
                }

                // Handle relative modules
                if (/^\.{1,2}\//.test(target)) {
                    target = parentName.split('/').slice(0, -1).concat([target])
                                .join('/').replace(/[^/]+\/\.\.\//, '').replace(/\.\//, '');
                }

                // Run the result through this normalizer again if required
                return target ? normalizeForIntern.call(this, target) : '@intern-systemjs-loader:undefined';
            }

            // intern/main is the same, it defines some properties but also provides access to the tdd,
            // bdd, qunit and object interfaces. We can ignore the module and normalize the
            // interfaces to their proper locations.
            if (name.indexOf('intern!') === 0) {
                return normalize.call(this, internBase + '/lib/interfaces/' + name.split('!')[1] + '.js');
            }

            // dojo/node!x can be normalized to @node/x
            if (/^(?:intern\/)?dojo\/node!/.test(name)) {
                return '@intern-systemjs-loader:node!' + name.split('!')[1];
            }

            return normalize.call(this, name, parentName, parentAddress);
        };
    }

    function loadSystemJS() {
        loadScript(systemJSUrl, swapLoader);
    }

    function loadScript(src, cb) {
        var script = document.createElement('script');

        script.src = src;
        script.onload = cb;

        document.body.appendChild(script);
    }

    function swapLoader() {
        global.require = realRequire = System.amdRequire;
        global.define = realDefine = System.amdDefine;
        realRequire.config = System.config.bind(System);
        realRequire.nodeRequire = nodeRequire;

        setHooks();

        // Flush any queues that were populated before SystemJS finished loading
        while (configQueue.length) {
            System.config.apply(System, configQueue.shift());
        }
        while (defineQueue.length) {
            realDefine.apply(null, defineQueue.shift());
        }
        while (requireQueue.length) {
            realRequire.apply(null, requireQueue.shift());
        }
    }

    // Provide the initial define, require and config functions. These just push the arguments to
    // arrays so they can be recalled when SystemJS has finished loading.
    global.define = function () {
        if (realDefine) {
            realDefine.apply(null, arguments);
        }
        else {
            defineQueue.push(slice.call(arguments));
        }
    };

    global.require = function () {
        if (realRequire) {
            realRequire.apply(null, arguments);
        }
        else {
            requireQueue.push(slice.call(arguments));
        }
    };

    require.config = function () {
        configQueue.push(slice.call(arguments));
    };

    if (nodeRequire) {
        // Pre-cache punycode so that global define doesn't break it
        // see https://github.com/bestiejs/punycode.js/issues/47
        nodeRequire('punycode');

        // Require the loader and set global
        global.SystemJS = global.System = nodeRequire('systemjs');

        // Fix decanonicalize so it doesn't add file:// to intern/ paths
        var decanonicalize = System.decanonicalize;
        System.decanonicalize = function (name, id) {
            var done = decanonicalize.call(this, name, id);

            if (/^intern\//.test(name)) {
                // remove absolute file urls with drive letters in Windows (i.e., file:///C:\...)
                if (/^file:\/{3}\w:/.test(done)) {
                    done = done.replace(/^file:\/{3}/, '');
                }
                else {
                    // remove non-windows, or relative, file urls
                    done = done.replace(/^file:\/\//, '');
                }
            }

            return done;
        };

        swapLoader();
    }
    // Load when.js first if Promise is unavailable
    else if (typeof Promise === 'undefined') {
        loadScript(polyfillUrl, loadSystemJS);
    }
    else {
        loadSystemJS();
    }
})(typeof global !== 'undefined' ? global : window);
