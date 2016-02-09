// SNSAdapter
//
// Uses SNS for push notification

var AWS = require('aws-sdk');
var path = require('path');
var rest = require('./rest');

var DEFAULT_REGION = "us-east-1";
var DEFAULT_APNS = "APNS_SANDBOX";
var DEFAULT_GCM = "GCM_SANDBOX";
// Publish to an SNS endpoint
// Providing AWS access and secret keys is mandatory
// Region will use sane defaults if omitted
function SNSAdapter(accessKey, secretKey, options) {
  options = options || {};

  this.region = options.region || DEFAULT_REGION;

  AWS.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    region: options.region || DEFAULT_REGION
  });
  this.apns = options.apns || DEFAULT_APNS
  this.gcm = options.gcm || DEFAULT_GCM
  this.sns = new AWS.SNS();
}

//Generate proper json for APNS message
SNSAdapter.prototype.generateiOSPayload = function (params, badge){
  var message = params.message
  var sound = params.sound
  var payloadString = JSON.stringify({aps: {alert: message, sound:sound, badge:badge}})
  var payload = {default: message}
  payload[this.apns] = payloadString
  return JSON.stringify(payload)
}

// Generate proper json for GCM message
SNSAdapter.prototype.generateAndroidPayload = function (params, badge){
   var message = params.message
   var payloadString = JSON.stringify({data: {message: message }})
   var payload = {default: message}
   payload[this.gcm] = payloadString
   return JSON.stringify(payload)
}

// For a given config object, endpoint and payload, publish via SNS
// Returns a promise containing the SNS object publish response
SNSAdapter.prototype.publish = function(config, auth, installation, params) {
  
  var badge = installation.badge + 1
  var deviceType = installation.deviceType
  
  if (deviceType == 'ios') {
    var payload = this.generateiOSPayload(params, badge)
  } else {
    var payload = this.generateAndroidPayload(params, badge)
  }

  var object = {
    Message: payload,
    MessageStructure: 'json',
    TargetArn: installation.arn
  };
  
  return new Promise((resolve, reject) => {
    this.sns.publish(object, (err, data) => {
      if (err !== null) return reject(err);
      rest.update(config, auth, '_Installation',  installation.objectId, {badge: badge })
      resolve(data);
    });
  });
}

module.exports = SNSAdapter;