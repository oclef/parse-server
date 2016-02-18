'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LoggerController = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _node = require('parse/node');

var _PromiseRouter = require('../PromiseRouter');

var _PromiseRouter2 = _interopRequireDefault(_PromiseRouter);

var _rest = require('../rest');

var _rest2 = _interopRequireDefault(_rest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = _node.Parse.Promise;
var INFO = 'info';
var ERROR = 'error';
var MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

// only allow request with master key
var enforceSecurity = function enforceSecurity(auth) {
  if (!auth || !auth.isMaster) {
    throw new _node.Parse.Error(_node.Parse.Error.OPERATION_FORBIDDEN, 'Clients aren\'t allowed to perform the ' + 'get' + ' operation on logs.');
  }
};

// check that date input is valid
var isValidDateTime = function isValidDateTime(date) {
  if (!date || isNaN(Number(date))) {
    return false;
  }
};

var LoggerController = exports.LoggerController = function () {
  function LoggerController(loggerAdapter) {
    _classCallCheck(this, LoggerController);

    this._loggerAdapter = loggerAdapter;
  }

  // Returns a promise for a {response} object.
  // query params:
  // level (optional) Level of logging you want to query for (info || error)
  // from (optional) Start time for the search. Defaults to 1 week ago.
  // until (optional) End time for the search. Defaults to current time.
  // order (optional) Direction of results returned, either “asc” or “desc”. Defaults to “desc”.
  // size (optional) Number of rows returned by search. Defaults to 10


  _createClass(LoggerController, [{
    key: 'handleGET',
    value: function handleGET(req) {
      if (!this._loggerAdapter) {
        throw new _node.Parse.Error(_node.Parse.Error.PUSH_MISCONFIGURED, 'Logger adapter is not availabe');
      }

      var promise = new _node.Parse.Promise();
      var from = isValidDateTime(req.query.from) && new Date(req.query.from) || new Date(Date.now() - 7 * MILLISECONDS_IN_A_DAY);
      var until = isValidDateTime(req.query.until) && new Date(req.query.until) || new Date();
      var size = Number(req.query.size) || 10;
      var order = req.query.order || 'desc';
      var level = req.query.level || INFO;
      enforceSecurity(req.auth);
      this._loggerAdapter.query({
        from: from,
        until: until,
        size: size,
        order: order,
        level: level
      }, function (result) {
        promise.resolve({
          response: result
        });
      });
      return promise;
    }
  }, {
    key: 'getExpressRouter',
    value: function getExpressRouter() {
      var _this = this;

      var router = new _PromiseRouter2.default();
      router.route('GET', '/logs', function (req) {
        return _this.handleGET(req);
      });
      return router;
    }
  }]);

  return LoggerController;
}();

exports.default = LoggerController;