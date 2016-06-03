/**
 * videojs-per-source-behaviors
 * @version 1.0.0-0
 * @copyright 2016 Brightcove, Inc.
 * @license Apache-2.0
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojsPerSourceBehaviors = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _videoJs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _videoJs2 = _interopRequireDefault(_videoJs);

var Html5 = _videoJs2['default'].getTech('Html5');

/**
 * For the most part, these are the events that occur early in the lifecycle
 * of a player, but there is considerable variability across browsers and
 * devices (not to mention properties like autoplay and preload). As such, we
 * listen to a bunch of events for source changes.
 *
 * @type {Array}
 */
var CHANGE_DETECT_EVENTS = ['abort', 'canplay', 'emptied', 'loadeddata', 'loadedmetadata', 'loadstart', 'play', 'playing'];

/**
 * Creates an event binder function of a given type.
 *
 * @param  {String} type
 *         Should be "on" or "one".
 *
 * @return {Function}
 */
var createPerSrcBinder = function createPerSrcBinder(type) {
  return function (first, second) {
    var _this = this;

    var isTargetPlayer = arguments.length === 2;
    var originalSrc = this.currentSrc();

    // This array is the set of arguments to use for `on()` and `off()` methods
    // of the player.
    var args = [first];

    // Make sure we bind here so that a GUID is set on the original listener
    // and that it is bound to the proper context.
    var originalListener = _videoJs2['default'].bind(isTargetPlayer ? this : first, arguments[arguments.length - 1]);

    // The wrapped listener `subargs` are the arguments passed to the original
    // listener (i.e. the Event object and an additional data hash).
    var wrappedListener = function wrappedListener() {
      if (_this.currentSrc() !== originalSrc) {
        _this.off.apply(_this, args);
      } else {
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

    return this[type].apply(this, args);
  };
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
var onPerSrc = createPerSrcBinder('on');

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
var onePerSrc = createPerSrcBinder('one');

/**
 * Applies per-source behaviors to a video.js Player object.
 *
 * @function perSourceBehaviors
 */
var perSourceBehaviors = function perSourceBehaviors() {
  var _this2 = this;

  var cachedSrc = undefined;
  var srcChangeTimer = undefined;

  // Add the per-source event binding methods to this player.
  this.onPerSrc = onPerSrc;
  this.onePerSrc = onePerSrc;

  this.on(CHANGE_DETECT_EVENTS, function (e) {

    if (srcChangeTimer || !_this2.currentSrc()) {
      return;
    }

    // Track any and all interim events from this one until the next tick
    // when we evaluate the timer.
    var interimEvents = [];

    var addInterimEvent = function addInterimEvent(f) {
      interimEvents.push({ time: Date.now(), event: f });
    };

    addInterimEvent(e);
    _this2.on(Html5.Events, addInterimEvent);

    srcChangeTimer = window.setTimeout(function () {
      var currentSrc = _this2.currentSrc();

      _this2.off(Html5.Events, addInterimEvent);
      srcChangeTimer = null;

      if (currentSrc && currentSrc !== cachedSrc) {

        _this2.trigger('sourcechanged', {
          interimEvents: interimEvents,
          from: cachedSrc,
          to: currentSrc
        });

        cachedSrc = currentSrc;
      }
    }, 1);
  });
};

_videoJs2['default'].plugin('perSourceBehaviors', perSourceBehaviors);
perSourceBehaviors.VERSION = '1.0.0-0';

exports['default'] = perSourceBehaviors;
module.exports = exports['default'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});