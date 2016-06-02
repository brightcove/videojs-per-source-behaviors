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

/**
 * Applies per-source behaviors to a video.js Player object.
 *
 * @function perSourceBehaviors
 */
const perSourceBehaviors = function() {
  let cachedSrc;
  let srcChangeTimer;

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
