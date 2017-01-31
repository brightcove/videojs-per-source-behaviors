import videojs from 'video.js';

const Html5 = videojs.getTech('Html5');

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
 * These are the ad loading and playback states we care about.
 *
 * @type {Array}
 */
const AD_STATES = [
  'ad-playback',
  'ads-ready',
  'postroll?',
  'preroll?'
];

/**
 * Whether or not the player is in an ad state. Ideally, this function would
 * not need to exist, but hooks provided by contrib-ads are not sufficient to
 * cover all conditions at this time.
 *
 * @return {Boolean}
 */
const isInAdPlayback = (p) =>
  !!p.ads && typeof p.ads === 'object' && AD_STATES.indexOf(p.ads.state) > -1;

/**
 * Creates an event binder function of a given type.
 *
 * @param  {Boolean} isOne
 *         Rather than delegating to the player's `one()` method, we want to
 *         retain full control over when the listener is unbound (particularly
 *         due to the ability for per-source behaviors to be toggled on and
 *         off at will).
 *
 * @return {Function}
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

    return this.on(...args);
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
const onPerSrc = createPerSrcBinder();

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
const onePerSrc = createPerSrcBinder(true);

/**
 * Applies per-source behaviors to a video.js Player object.
 *
 * @function perSourceBehaviors
 */
const perSourceBehaviors = function() {
  let cachedSrc;
  let disabled = false;
  let srcChangeTimer;
  let srcStable = true;

  this.perSourceBehaviors = {

    /**
     * Disable per-source behaviors on this player.
     *
     * @return {Boolean}
     */
    disable() {
      window.clearTimeout(srcChangeTimer);
      srcChangeTimer = null;
      disabled = true;
      return disabled;
    },

    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {Boolean}
     */
    disabled() {
      return disabled;
    },

    /**
     * Enable per-source behaviors on this player.
     *
     * @return {Boolean}
     */
    enable() {
      disabled = false;
      return disabled;
    },

    /**
     * Whether per-source behaviors are disabled on this player.
     *
     * @return {Boolean}
     */
    enabled() {
      return !disabled;
    },

    /**
     * Whether or not the source is "stable". This will return `true` if the
     * plugin feels that we may be about to change sources.
     *
     * @return {Boolean}
     */
    isSrcStable() {
      return srcStable;
    },

    VERSION: '__VERSION__'
  };

  // Add the per-source event binding methods to this player.
  this.onPerSrc = onPerSrc;
  this.onePerSrc = onePerSrc;

  this.on(CHANGE_DETECT_EVENTS, (e) => {

    // Bail-out conditions.
    if (
      this.perSourceBehaviors.disabled() ||
      srcChangeTimer ||
      isInAdPlayback(this)
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
      let currentSrc = this.currentSrc();

      srcStable = true;
      srcChangeTimer = null;
      this.off(Html5.Events, addInterimEvent);

      if (currentSrc && currentSrc !== cachedSrc) {

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

videojs.plugin('perSourceBehaviors', perSourceBehaviors);
perSourceBehaviors.VERSION = '__VERSION__';

export default perSourceBehaviors;
