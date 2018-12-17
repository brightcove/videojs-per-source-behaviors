import document from 'global/document';
import QUnit from 'qunitjs';
import sinon from 'sinon';
import videojs from 'video.js';
import plugin from '../src/plugin';

const triggerSeriesMaker = (player) => (series) => {
  series.forEach((item) => player.trigger(item));
};

/**
 * Assertion for testing a subset of event data.
 *
 * @param  {Object} data
 * @param  {Object} expected
 * @param  {string} [message]
 */
QUnit.assert.eventDataMatches = function(data, expected, message) {
  this.deepEqual({
    from: data.from,
    to: data.to,

    // Convert interimEvents to extract only `time` and `type`.
    interimEvents: data.interimEvents.map(o => ({time: o.time, type: o.event.type}))
  }, expected, message);
};

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('sourcechanged matrix', {

  beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = sinon.useFakeTimers();

    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);

    // Mock the usingPlugin method in a way that makes it easier to override
    // the `ads` property of the player without losing plugin detection
    // capabilities.
    this.player.usingPlugin = (name) =>
      name === 'ads' ? !!this.player.ads : videojs.getComponent('Player').prototype.usingPlugin.call(this.player, name);

    this.player.perSourceBehaviors();

    // Tick forward enough to ready the player.
    this.clock.tick(1);
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('previous-null, current-null, no-ads', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-null, current-null, no-ads, no sourcechanged event'
  );
});

QUnit.test('previous-null, current-foo.mp4, no-ads', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-null, current-foo.mp4, no-ads, sourcechanged event'
  );
});

QUnit.test('previous-null, current-ad.mp4, ads-preroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {state: 'preroll?'};

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-null, current-ad.mp4, ads-preroll, no sourcechanged event'
  );
});

QUnit.test('previous-null, current-ad.mp4, ads-postroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {state: 'postroll?'};

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-null, current-ad.mp4, ads-postroll, no sourcechanged event'
  );
});

QUnit.test('previous-null, current-ad.mp4, ads-ad-playback', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {state: 'ad-playback'};

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-null, current-ad.mp4, ads-ad-playback, no sourcechanged event'
  );
});

QUnit.test('previous-null, current-foo.mp4, no-ads (ads-ready)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {state: 'ads-ready'};

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-null, current-ad.mp4, no-ads (ads-ready), no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, no-ads', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, no-ads, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, ads-preroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'preroll?'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, ads-preroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, ads-postroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'postroll?'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, ads-postroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, ads-ad-playback', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ad-playback'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, ads-ad-playback, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, no-ads (ads-ready)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ads-ready'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, no-ads (ads-ready), sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-bar.mp4, no-ads', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.currentSrc = () => 'bar.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-foo.mp4, current-bar.mp4, no-ads, sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-bar.mp4, ads-preroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'preroll?'};
  this.player.currentSrc = () => 'bar.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-bar.mp4, ads-preroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-bar.mp4, ads-postroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'postroll?'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, ads-postroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-bar.mp4, ads-ad-playback', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ad-playback'};
  this.player.currentSrc = () => 'bar.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-bar.mp4, ads-ad-playback, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-bar.mp4, no-ads (ads-ready)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ads-ready'};
  this.player.currentSrc = () => 'bar.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-foo.mp4, current-bar.mp4, no-ads (ads-ready), sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-ad.mp4, ads-preroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'preroll?'};
  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-ad.mp4, ads-preroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-ad.mp4, ads-postroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'postroll?'};
  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, ads-postroll, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-ad.mp4, ads-ad-playback', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ad-playback'};
  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-ad.mp4, ads-ad-playback, no sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-ad.mp4, no-ads (ads-ready)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ads-ready'};
  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-foo.mp4, current-ad.mp4, no-ads (ads-ready), sourcechanged event'
  );
});

QUnit.test('previous-ad.mp4, current-foo.mp4, ads-preroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'preroll?'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-ad.mp4, current-foo.mp4, ads-preroll, no sourcechanged event'
  );
});

QUnit.test('previous-ad.mp4, current-foo.mp4, ads-postroll', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'postroll?'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-ad.mp4, current-foo.mp4, ads-postroll, no sourcechanged event'
  );
});

QUnit.test('previous-ad.mp4, current-foo.mp4, ads-ad-playback', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ad-playback'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-ad.mp4, current-foo.mp4, ads-ad-playback, no sourcechanged event'
  );
});

QUnit.test('previous-ad.mp4, current-foo.mp4, no-ads (ads-ready)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'ad.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {state: 'ads-ready'};
  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-foo.mp4, current-ad.mp4, no-ads (ads-ready), sourcechanged event'
  );
});

QUnit.test('previous-null, current-foo.mp4, contrib-ads-6 isInAdMode => false (ignores ads state)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {

    // Pick a state at odds with what is reported from isInAdMode
    state: 'preroll?',
    inAdBreak() {},
    isInAdMode() {
      return false;
    }
  };

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-null, current-foo.mp4, contrib-ads-6 isInAdMode => false (ignores ads state), sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, contrib-ads-6 isInAdMode => false (ignores ads state)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {

    // Pick a state at odds with what is reported from isInAdMode
    ads: 'preroll?',
    inAdBreak() {},
    isInAdMode() {
      return false;
    }
  };

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, contrib-ads-6 isInAdMode => false (ignores ads state), sourcechanged event'
  );
});

QUnit.test('previous-null, current-foo.mp4, contrib-ads-6 isInAdMode => true (ignores ads state)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.ads = {

    // Pick a state at odds with what is reported from isInAdMode
    state: 'content-playback',
    inAdBreak() {},
    isInAdMode() {
      return true;
    }
  };

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    1,
    'previous-null, current-foo.mp4, contrib-ads-6 isInAdMode => true (ignores ads state), sourcechanged event'
  );
});

QUnit.test('previous-foo.mp4, current-foo.mp4, contrib-ads-6 isInAdMode => true (ignores ads state)', function(assert) {
  const spy = sinon.stub();

  this.player.on('sourcechanged', spy);

  const triggerSeries = triggerSeriesMaker(this.player);

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  // we don't care about the first video, only the current one
  spy.reset();

  this.player.ads = {

    // Pick a state at odds with what is reported from isInAdMode
    state: 'content-playback',
    inAdBreak() {},
    isInAdMode() {
      return true;
    }
  };

  this.player.currentSrc = () => 'foo.mp4';

  triggerSeries([
    'loadstart',
    'canplay',
    'play',
    'playing'
  ]);

  this.clock.tick(10);

  assert.deepEqual(
    spy.callCount,
    0,
    'previous-foo.mp4, current-foo.mp4, contrib-ads-6 isInAdMode => true (ignores ads state), sourcechanged event'
  );
});
