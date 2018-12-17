import videojs from 'video.js';
import {version as VERSION} from '../package.json';

const Html5 = videojs.getTech('Html5');

// Video.js 5/6 cross-compatibility.
const registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * For the most part, these are the events that occur early in the lifecycle
 * of a source, but there is considerable variability across browsers and
 * devices (not to mention properties like autoplay and preload). As such, we
 * listen to a bunch of events for source changes.
 *
 * @type {Array}
 */
const CHANGE_DETECT_EVENTS = [
  'abort',
  'emptied',
  'loadstart',
  'play'
];

/**
 * These events will indicate that the source is "unstable" (i.e. it might be
 * about to change).
 *
 * @type {Array}
 */
const UNSTABLE_EVENTS = [
  'abort',
  'emptied'
];

/**
 * These are the ad loading and playback states we care about from
 * contrib-ads 5.
 *
 * @type {Array}
 */
const AD_STATES = [
  'ad-playback',
  'ads-ready?',
  'postroll?',
  'preroll?'
];

/**
 * Whether or not a string represents an "ad state".
 *
 * @param  {string} s
 *         The string to check
 *
 * @return {boolean}
 *         If the string is an ad state
 */
const isAdState = (s) => AD_STATES.indexOf(s) > -1;

/**
 * Determine whether or not a player is using contrib-ads 6+.
 *
 * @param  {Player} p
 *         The player
 *
 * @return {boolean}
 *         if the player is using contrib-ads 6+
 */
const usingAds6Plus = (p) => p.usingPlugin('ads') && typeof p.ads.inAdBreak === 'function';

/**
 * Whether or not the player should ignore an event due to ad states.
 *
 * @param  {Player} p
 *         The player
 *
 * @param  {Event} e
 *         An event object
 *
 * @return {boolean}
 *         If the player is in an ad state
 */
const ignoreEvent = (p, e) => {

  // No ads, no ad states to ignore!
  if (!p.usingPlugin('ads')) {
    return false;
  }

  // In contrib-ads 6+ we only care about non-loadstart events because
  // loadstart events _may_ happen during ad mode.
  if (usingAds6Plus(p)) {
    return p.ads.isInAdMode() && e.type !== 'loadstart';
  }

  // contrib-ads 5+
  return isAdState(p.ads.state);
};

/**
 * Applies per-source behaviors to a video.js Player object.
 */
const perSourceBehaviors = function() {
  const perSrcListeners = [];
  let cachedSrc;
  let disabled = false;
  let srcChangeTimer;
  let srcStable = true;

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
  const createPerSrcBinder = (isOne) => {
    return function(first, second) {

      // Do not bind new listeners when per-source behaviors are disabled.
      if (this.perSourceBehaviors.disabled()) {
        return;
      }

      const isTargetPlayer = arguments.length === 2;
      const originalSrc = this.currentSrc();

      // This array is the set of arguments to use for `on()` and `off()` methods
      // of the player.
      const args = [first];

      // Make sure we bind here so that a GUID is set on the original listener
      // and that it is bound to the proper context.
      const originalListener = videojs.bind(
        isTargetPlayer ? this : first,
        arguments[arguments.length - 1]
      );

      // The wrapped listener `subargs` are the arguments passed to the original
      // listener (i.e. the Event object and an additional data hash).
      const wrappedListener = (...subargs) => {
        const changed = this.currentSrc() !== originalSrc;

        // Do not evaluate listeners if per-source behaviors are disabled.
        if (this.perSourceBehaviors.disabled()) {
          return;
        }

        if (changed || isOne) {
          this.off(...args);
        }

        if (!changed) {
          originalListener(...subargs);
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

      return this.on(...args);
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
      disabled = true;
      return disabled;
    }),

    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {boolean}
     *         if the per-source behaviors are disabled
     */
    disabled() {
      return disabled;
    },

    /**
     * Enable per-source behaviors on this player.
     *
     * @return {boolean}
     *         always returns true
     */
    enable() {
      disabled = false;
      return disabled;
    },

    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {boolean}
     *         if the per-source behaviors are enabled
     */
    enabled() {
      return !disabled;
    },

    /**
     * Whether or not the source is "stable". This will return `true` if the
     * plugin feels that we may be about to change sources.
     *
     * @return {boolean}
     *         Whether the source is stable or not
     */
    isSrcStable() {
      return srcStable;
    },

    VERSION
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
  this.on('dispose', () => {
    perSrcListeners.length = 0;
  });

  this.on(CHANGE_DETECT_EVENTS, (e) => {

    // Bail-out conditions.
    if (
      this.perSourceBehaviors.disabled() ||
      srcChangeTimer ||
      ignoreEvent(this, e)
    ) {
      return;
    }

    // If we did not previously detect that we were in an unstable state and
    // this was an event that qualifies as unstable, do that now. In the future,
    // we may want to restrict the conditions under which this is triggered by
    // checking networkState and/or readyState for reasonable values such as
    // NETWORK_NO_SOURCE and HAVE_NOTHING.
    if (
      srcStable &&
      UNSTABLE_EVENTS.indexOf(e.type) > -1
    ) {
      srcStable = false;
      this.trigger('sourceunstable');
    }

    // Track any and all interim events from this one until the next tick
    // when we evaluate the timer.
    const interimEvents = [];

    const addInterimEvent = (f) =>
      interimEvents.push({time: Date.now(), event: f});

    addInterimEvent(e);
    this.on(Html5.Events, addInterimEvent);

    srcChangeTimer = this.setTimeout(() => {
      const currentSrc = this.currentSrc();

      srcStable = true;
      srcChangeTimer = null;
      this.off(Html5.Events, addInterimEvent);

      if (currentSrc && currentSrc !== cachedSrc) {

        // Remove per-source listeners explicitly when we know the source has
        // changed before we trigger the "sourcechanged" listener.
        perSrcListeners.forEach(args => this.off(...args));
        perSrcListeners.length = 0;

        this.trigger('sourcechanged', {
          interimEvents,
          from: cachedSrc,
          to: currentSrc
        });

        cachedSrc = currentSrc;
      }
    }, 1);
  });
};

perSourceBehaviors.VERSION = VERSION;

registerPlugin('perSourceBehaviors', perSourceBehaviors);

export default perSourceBehaviors;
