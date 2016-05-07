(function () {
    var realRequire, realDefine,
        slice = Array.prototype.slice,
        internBase = '/node_modules/intern',
        thisBase = '/node_modules/intern-systemjs-loader',
        polyfillUrl = '/node_modules/systemjs/dist/system-polyfills.js',
        systemJSUrl = '/node_modules/systemjs/dist/system.src.js',
        requireQueue = [],
        defineQueue = [],
        configQueue = [
            [{
                pluginFirst: true,
                baseURL: '/',
                meta: {
                    'intern/*': { scriptLoad: true },
                    'dojo/*': { scriptLoad: true }
                },
                packages: {
                    'intern': { format: 'amd', defaultExtension: 'js' },
                    'dojo': { format: 'amd', defaultExtension: 'js' }
                },
                map: {
                    'dojo': 'node_modules/dojo',
                    'intern': internBase,
                    'intern/chai': internBase + '/browser_modules/chai/chai.js'
                }
            }]
        ];

    function setHooks() {
        var normalize = SystemJS.normalize,
            hasMap = {
                'host-browser': true,
                'host-node': false
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

        // Normalize "dojo/has" to either our hasPlugin or hasModule GUIDs depending on whether it's
        // required as a loader plugin or a module.
        SystemJS.normalize = function (name, parentName, parentAddress) {
            var current, split, target,
                // Matcher for `dojo/has!foo?bar:baz`, where bar or baz could also be a ternary condition
                matcher = /[^?]+(?=\?([^:]+)(?::(.+))?)/,
                hook = name.indexOf('dojo/has') === 0
                            || name.indexOf('./has') === 0 && parentName.split('/').slice(-2)[0] === 'dojo';

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

                return target ? normalize.call(this, target) : '@intern-systemjs-loader:undefined';
            }

            // intern/main is the same, it defines some properties but also provides access to the tdd,
            // bdd, qunit and object interfaces. We can ignore the module and normalize the
            // interfaces to their proper locations.
            if (name.indexOf('intern!') === 0) {
                return normalize.call(this, internBase + '/lib/interfaces/' + name.split('!')[1] + '.js');
            }

            return normalize.call(this, name, parentName, parentAddress);
        };

    }

    function loadSystemJS() {
        loadScript(systemJSUrl, function () {
            window.require = realRequire = System.amdRequire;
            window.define = realDefine = System.amdDefine;
            require.config = System.config.bind(System);

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
        });
    }

    function loadScript(src, cb) {
        var script = document.createElement('script');

        script.src = src;
        script.onload = cb;

        document.body.appendChild(script);
    }

    // Provide the initial define, require and config functions. These just push the arguments to
    // arrays so they can be recalled when SystemJS has finished loading.
    window.define = function () {
        if (realDefine) {
            realDefine.apply(null, arguments);
        }
        else {
            defineQueue.push(slice.call(arguments));
        }
    };

    window.require = function () {
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

    // Load when.js first if Promise is unavailable
    if (typeof Promise === 'undefined') {
        loadScript(polyfillUrl, loadSystemJS);
    }
    else {
        loadSystemJS();
    }
})();
