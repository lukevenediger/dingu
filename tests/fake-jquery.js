/// <reference path="../bower_components/underscore/underscore.js" />
/// <reference path="../bower_components/jquery/jquery.js" />
var FakeJQuery = function () {

  this._lastRequest = {};
  this._lastRequestPromise;

  this.get = function(url,
      data,
      successCallback,
      dataType) {
    this._lastRequest.url = url;
    this._lastRequest.data = data;
    this._lastRequest.successCallback = successCallback;
    this._lastRequest.dataType = dataType;
    this._lastRequestPromise = jQuery.Deferred();
    var that = this;
    setTimeout(function () {
      successCallback();
      that._lastRequestPromise.resolve(that._lastRequest);
    }, _.random(500))
  };

  /**
   * Returns the last request made.
   * @returns {Deferred} a promise that's resolved once an http request is made
   */
  this.getLastRequest = function () {
    return this._lastRequestPromise.promise();
  };
};