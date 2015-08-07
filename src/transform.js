const through = require('through2');
const pjson = require('../package.json');

/**
 * Resolve path to library file
 * @param  {String} file
 * @return {String}
 */
function pathTo(file) {
  return pjson.name + '/src/' + file;
}

/**
 * Initialize react live patch
 * @description Inject React & WS, create namespace
 * @param  {Object} options
 * @return {String}
 */
function initialize(options) {
  var port = options.port;

  return '\n' +
    'var $$scope = window.__hmr = (window.__hmr || {});\n' +
    '(function() {\n' +
      'if (!$$scope.initialized) {\n' +
        'require("' + pathTo('injectReactDeps') + '")($$scope);\n' +
        'require = require("' + pathTo('overrideRequire') + '")($$scope, require);\n' +
        'require("' + pathTo('injectWebSocket') + '")($$scope, require, ' + port + ');' +
        '$$scope.initialized = true;\n' +
      '}\n' +
    '})();\n';
}

/**
 * Decorate every component module by `react-hot-api` makeHot method
 * @return {String}
 */
function overrideExports() {
  return '\n' +
    'if (module.exports.name || module.exports.displayName) {\n' +
      'module.exports = $$scope.makeHot(module.exports);\n' +
    '}\n';
}

/**
 * Check if file is JSON (duck test)
 * @param  {String}  file
 * @return {Boolean}
 */
function isJSON(file) {
  return file.slice(-4) === 'json';
}

module.exports = function applyReactHotAPI(file, options) {
  var content = [];
  var port = options.port;

  return through(
    function transform(part, enc, next) {
      content.push(part);
      next();
    },

    function finish(done) {
      var bundle;
      content = content.join('');

      if (isJSON(file)) {
        bundle = content;
      } else {
        bundle = initialize({ port: port, }) +
          content +
          overrideExports();
      }

      this.push(bundle);
      done();
    }
  );
};
