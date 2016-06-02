import videojs from 'video.js';

const Html5 = videojs.getTech('Html5');

/**
 * For the most part, these are the events that occur early in the lifecycle
 * of a player, but there is considerable variability across browsers and
 * devices (not to mention properties like autoplay and preload). As such, we
 * listen to a bunch of events for source changes.
 *
 * @type {Array}
 */
const CHANGE_DETECT_EVENTS = [
  'abort',
  'canplay',
  'emptied',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'play',
  'playing'
];

const createPerSrcBinder = (type) => {
  return function(first, second) {
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
      if (this.currentSrc() !== originalSrc) {
        this.off(...args);
      } else {
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

    return this[type](...args);
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
const onPerSrc = createPerSrcBinder('on');

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
const onePerSrc = createPerSrcBinder('one');

/**
 * Applies per-source behaviors to a video.js Player object.
 *
 * @function perSourceBehaviors
 */
const perSourceBehaviors = function() {
  let cachedSrc;
  let srcChangeTimer;

  // Add the per-source event binding methods to this player.
  this.onPerSrc = onPerSrc;
  this.onePerSrc = onePerSrc;

  this.on(CHANGE_DETECT_EVENTS, (e) => {

    if (srcChangeTimer || !this.currentSrc()) {
      return;
    }

    // Track any and all interim events from this one until the next tick
    // when we evaluate the timer.
    const interimEvents = [];

    const addInterimEvent = (f) => {
      interimEvents.push({time: Date.now(), event: f});
    };

    addInterimEvent(e);
    this.on(Html5.Events, addInterimEvent);

    srcChangeTimer = window.setTimeout(() => {
      let currentSrc = this.currentSrc();

      this.off(Html5.Events, addInterimEvent);
      srcChangeTimer = null;

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
