/*!
 * @name videojs-per-source-behaviors
 * @version 1.1.4
 * @author Brightcove, Inc.
 * @license Apache-2.0
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojsPerSourceBehaviors = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _interopDefault(ex) {
  return ex && (typeof ex === 'undefined' ? 'undefined' : _typeof(ex)) === 'object' && 'default' in ex ? ex['default'] : ex;
}

var videojs = _interopDefault((typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null));

var Html5 = videojs.getTech('Html5');

// Video.js 5/6 cross-compatibility.
var registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * For the most part, these are the events that occur early in the lifecycle
 * of a source, but there is considerable variability across browsers and
 * devices (not to mention properties like autoplay and preload). As such, we
 * listen to a bunch of events for source changes.
 *
 * @type {Array}
 */
var CHANGE_DETECT_EVENTS = ['abort', 'emptied', 'loadstart', 'play'];

/**
 * These events will indicate that the source is "unstable" (i.e. it might be
 * about to change).
 *
 * @type {Array}
 */
var UNSTABLE_EVENTS = ['abort', 'emptied'];

/**
 * These are the ad loading and playback states we care about.
 *
 * @type {Array}
 */
var AD_STATES = ['ad-playback', 'ads-ready?', 'postroll?', 'preroll?'];

/**
 * Applies per-source behaviors to a video.js Player object.
 */
var perSourceBehaviors = function perSourceBehaviors() {
  var _this = this;

  var perSrcListeners = [];
  var cachedSrc = void 0;
  var _disabled = false;
  var srcChangeTimer = void 0;
  var srcStable = true;

  /**
   * Whether or not the player is in an ad state. Ideally, this function would
   * not need to exist, but hooks provided by contrib-ads are not sufficient to
   * cover all conditions at this time.
   *
   * @return {boolean}
   *         whether the player is in an ad state or not
   */
  var isInAdPlayback = function isInAdPlayback() {
    return !!_this.ads && _typeof(_this.ads) === 'object' && AD_STATES.indexOf(_this.ads.state) > -1;
  };

  /**
   * Creates an event binder function of a given type.
   *
   * @param  {boolean} isOne
   *         Rather than delegating to the player's `one()` method, we want to
   *         retain full control over when the listener is unbound (particularly
   *         due to the ability for per-source behaviors to be toggled on and
   *         off at will).
   *
   * @return {Function}
   *         the per source binder function
   */
  var createPerSrcBinder = function createPerSrcBinder(isOne) {
    return function (first, second) {
      var _this2 = this;

      // Do not bind new listeners when per-source behaviors are disabled.
      if (this.perSourceBehaviors.disabled()) {
        return;
      }

      var isTargetPlayer = arguments.length === 2;
      var originalSrc = this.currentSrc();

      // This array is the set of arguments to use for `on()` and `off()` methods
      // of the player.
      var args = [first];

      // Make sure we bind here so that a GUID is set on the original listener
      // and that it is bound to the proper context.
      var originalListener = videojs.bind(isTargetPlayer ? this : first, arguments[arguments.length - 1]);

      // The wrapped listener `subargs` are the arguments passed to the original
      // listener (i.e. the Event object and an additional data hash).
      var wrappedListener = function wrappedListener() {
        var changed = _this2.currentSrc() !== originalSrc;

        // Do not evaluate listeners if per-source behaviors are disabled.
        if (_this2.perSourceBehaviors.disabled()) {
          return;
        }

        if (changed || isOne) {
          _this2.off.apply(_this2, args);
        }

        if (!changed) {
          originalListener.apply(undefined, arguments);
        }
      };

      // Make sure the wrapped listener and the original listener share a GUID,
      // so that video.js properly removes event bindings when `off()` is passed
      // the original listener!
      wrappedListener.guid = originalListener.guid;

      // If we are targeting a different object from the player, we need to include
      // the second argument.
      if (!isTargetPlayer) {
        args.push(second);
      }

      args.push(wrappedListener);
      perSrcListeners.push(args);

      return this.on.apply(this, args);
    };
  };

  this.perSourceBehaviors = {

    /**
     * Disable per-source behaviors on this player.
     *
     * @return {boolean}
     */
    disable: videojs.bind(this, function disable() {
      this.clearTimeout(srcChangeTimer);
      srcChangeTimer = null;
      _disabled = true;
      return _disabled;
    }),

    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {boolean}
     *         if the per-source behaviors are disabled
     */
    disabled: function disabled() {
      return _disabled;
    },


    /**
     * Enable per-source behaviors on this player.
     *
     * @return {boolean}
     *         always returns true
     */
    enable: function enable() {
      _disabled = false;
      return _disabled;
    },


    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {boolean}
     *         if the per-source behaviors are enabled
     */
    enabled: function enabled() {
      return !_disabled;
    },


    /**
     * Whether or not the source is "stable". This will return `true` if the
     * plugin feels that we may be about to change sources.
     *
     * @return {boolean}
     *         Whether the source is stable or not
     */
    isSrcStable: function isSrcStable() {
      return srcStable;
    },


    VERSION: '1.1.4'
  };

  /**
   * Bind an event listener on a per-source basis.
   *
   * @function onPerSrc
   * @param  {String|Array|Component|Element} first
   *         The event type(s) or target Component or Element.
   *
   * @param  {Function|String|Array} second
   *         The event listener or event type(s) (when `first` is target).
   *
   * @param  {Function} third
   *         The event listener (when `second` is event type(s)).
   *
   * @return {Player}
   */
  this.onPerSrc = createPerSrcBinder();

  /**
   * Bind an event listener on a per-source basis. This listener can only
   * be called once.
   *
   * @function onePerSrc
   * @param  {String|Array|Component|Element} first
   *         The event type(s) or target Component or Element.
   *
   * @param  {Function|String|Array} second
   *         The event listener or event type(s) (when `first` is target).
   *
   * @param  {Function} third
   *         The event listener (when `second` is event type(s)).
   *
   * @return {Player}
   */
  this.onePerSrc = createPerSrcBinder(true);

  // Clear out perSrcListeners cache on player dispose.
  this.on('dispose', function () {
    perSrcListeners.length = 0;
  });

  this.on(CHANGE_DETECT_EVENTS, function (e) {

    // Bail-out conditions.
    if (_this.perSourceBehaviors.disabled() || srcChangeTimer || isInAdPlayback(_this)) {
      return;
    }

    // If we did not previously detect that we were in an unstable state and
    // this was an event that qualifies as unstable, do that now. In the future,
    // we may want to restrict the conditions under which this is triggered by
    // checking networkState and/or readyState for reasonable values such as
    // NETWORK_NO_SOURCE and HAVE_NOTHING.
    if (srcStable && UNSTABLE_EVENTS.indexOf(e.type) > -1) {
      srcStable = false;
      _this.trigger('sourceunstable');
    }

    // Track any and all interim events from this one until the next tick
    // when we evaluate the timer.
    var interimEvents = [];

    var addInterimEvent = function addInterimEvent(f) {
      return interimEvents.push({ time: Date.now(), event: f });
    };

    addInterimEvent(e);
    _this.on(Html5.Events, addInterimEvent);

    srcChangeTimer = _this.setTimeout(function () {
      var currentSrc = _this.currentSrc();

      srcStable = true;
      srcChangeTimer = null;
      _this.off(Html5.Events, addInterimEvent);

      if (currentSrc && currentSrc !== cachedSrc) {

        // Remove per-source listeners explicitly when we know the source has
        // changed before we trigger the "sourcechanged" listener.
        perSrcListeners.forEach(function (args) {
          return _this.off.apply(_this, args);
        });
        perSrcListeners.length = 0;

        _this.trigger('sourcechanged', {
          interimEvents: interimEvents,
          from: cachedSrc,
          to: currentSrc
        });

        cachedSrc = currentSrc;
      }
    }, 1);
  });
};

registerPlugin('perSourceBehaviors', perSourceBehaviors);
perSourceBehaviors.VERSION = '1.1.4';

module.exports = perSourceBehaviors;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[1])(1)
});
