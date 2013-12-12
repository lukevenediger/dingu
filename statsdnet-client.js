/**
 * A client library for sending metrics to statsd.net (https://github.com/lukevenediger/statsd.net/)
 *
 * @constructor
 * @param {string} targetURL the statsd.net http endpoint url
 * @param {string} [rootNamespace=""] a namespace to prefix all outgoing metrics with
 * @param {Number} [pumpIntervalSeconds=10] the time to wait between sending metrics
 * @param {Boolean} [logInternalMetrics=true] switch to enable or disable internal client metrics
 * @param {Object} [jQuery=window.jQuery] jquery library
 */
var StatsdnetClient = function (
    targetURL,
    rootNamespace,
    pumpIntervalSeconds,
    logInternalMetrics,
    jQuery) {

  if (!targetURL || targetURL === '') {
    throw new Error('Must specify where metrics will be sent to. Parameter: targetURL.');
  }
  rootNamespace = rootNamespace || '';
  pumpIntervalSeconds = pumpIntervalSeconds || 10;
  jQuery = jQuery || window.jQuery;

  this._url = targetURL;
  this._rootNamespace = rootNamespace;
  this._pumpIntervalMS = pumpIntervalSeconds * 1000;
  this._outputBuffer = [];
  this._logInternalMetrics = (logInternalMetrics || true);
  this._lastRequestLatency = 0;

  /**
   * Log a latency in milliseconds
   * 
   * @param {string} name the name of this measurement
   * @param {Number} milliseconds the time in milliseconds
   */
  this.timing = function (name, milliseconds) {
    this._outputBuffer.push(this._rootNamespace + name + ':' + milliseconds + '|ms');
  };

  /**
   * Log a count
   *
   * @param {string} name the name of this measurement
   * @param {Number} value the value
   */
  this.count = function (name, value) {
    value = value || 1;
    this._outputBuffer.push(this._rootNamespace + name + ':' + value + '|c');
  };

  /**
   * Log a gauge
   * 
   * @param {string} name the name of this measurement
   * @param {Number} value the value
   */
  this.gauge = function (name, value) {
    this._outputBuffer.push(this._rootNamespace + name + ':' + milliseconds + '|g');
  };

  /**
   * Sends out metrics every x seconds.
   */
  var pump = function () {
    if (this._outputBuffer.length > 0) {
      if (this._logInternalMetrics && this._lastRequestLatency) {
        this.timing('jsclient.post', this._lastRequestLatency);
      }
      var requestStart = new Date().getTime();
      var data = _outputBuffer.join(',');
      this._outputBuffer = [];
      var that = this;
      // Send the data on its way
      jQuery.get(
        this.targetURL,
        { metrics: data },
        function () {
          that._lastRequestLatency = new Date().getTime() - requestStart;
          setTimeout(pump, that._pumpIntervalMS);
        },
        'jsonp'
      );
    }
    setTimeout(pump, this._pumpIntervalMS);
  };
};