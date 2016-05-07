(function () {
    var realRequire, realDefine,
        slice = Array.prototype.slice,
        internBase = '/node_modules/intern',
        thisBase = '/node_modules/intern-systemjs-loader',
        polyfillUrl = '/node_modules/systemjs/dist/system-polyfills.js',
        systemJSUrl = '/node_modules/systemjs/dist/system.src.js',
        hasModule = generateGUID(),
        hasPlugin = generateGUID(),
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
        var hasMap = {
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
        // SystemJS doesn't support this, so we need to hack and split up the behaviours.
        // No need to normalize the GUID before setting.
        SystemJS.set(hasModule, System.newModule({
            __useDefault: true,
            default: has,
        }));

        SystemJS.set(hasPlugin, System.newModule({
            fetch: function (load) {
                var res = load.name.slice(hasPlugin.length + 1).split('?'),
                    shouldLoad = has(res[0]);

                return shouldLoad
                    ? 'define(["'+ res[1] +'"], function (m) { return m; })'
                    : 'define([], function () {})';
            }
        }));

        var normalize = SystemJS.normalize;

        // Normalize "dojo/has" to either our hasPlugin or hasModule GUIDs depending on whether it's
        // required as a loader plugin or a module.
        SystemJS.normalize = function (name, parentName, parentAddress) {
            var split,
                hook = name.indexOf('dojo/has') === 0
                            || name === './has' && parentName.split('/').slice(-2)[0] === 'dojo';

            if (hook) {
                split = name.split('!');
                return name.replace(/^(?:dojo|\.)\/has/, split[1] ? hasPlugin : hasModule);
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

    function generateGUID () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
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
