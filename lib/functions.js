'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// functions.js

var express = require('express'),
    Parse = require('parse/node').Parse,
    PromiseRouter = require('./PromiseRouter'),
    rest = require('./rest');

var router = new PromiseRouter();

function handleCloudFunction(req) {
  if (Parse.Cloud.Functions[req.params.functionName]) {
    var result;

    var _ret = function () {

      var params = Object.assign({}, req.body, req.query);

      if (Parse.Cloud.Validators[req.params.functionName]) {
        result = Parse.Cloud.Validators[req.params.functionName](params);

        if (!result) {
          throw new Parse.Error(Parse.Error.SCRIPT_FAILED, 'Validation failed.');
        }
      }

      return {
        v: new Promise(function (resolve, reject) {
          var response = createResponseObject(resolve, reject);
          var request = {
            params: params,
            master: req.auth && req.auth.isMaster,
            user: req.auth && req.auth.user,
            installationId: req.info.installationId
          };
          Parse.Cloud.Functions[req.params.functionName](request, response);
        })
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } else {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, 'Invalid function.');
  }
}

function createResponseObject(resolve, reject) {
  return {
    success: function success(result) {
      resolve({
        response: {
          result: Parse._encode(result)
        }
      });
    },
    error: function error(_error) {
      reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, _error));
    }
  };
}

router.route('POST', '/functions/:functionName', handleCloudFunction);

module.exports = router;