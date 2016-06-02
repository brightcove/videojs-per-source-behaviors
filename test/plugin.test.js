import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import plugin from '../src/plugin';

QUnit.test('the environment is sane', function(assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
  assert.strictEqual(typeof plugin, 'function', 'plugin is a function');
});

QUnit.module('videojs-per-source-behaviors', {

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
    this.player.perSourceBehaviors();

    // Tick forward enough to ready the player.
    this.clock.tick(1);
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('"sourcechanged" event', function(assert) {
  let metaData;
  const spy = sinon.spy();

  this.player.on('sourcechanged', spy);

  this.player.trigger('loadstart');
  this.player.trigger('canplay');
  this.player.trigger('play');
  this.player.trigger('playing');

  // For each assertion, tick 10ms to be sure multiple timeouts do not happen!
  this.clock.tick(10);

  assert.ok(!spy.called, 'no source, no "sourcechanged" event');

  this.player.currentSrc = () => 'x-1.mp4';
  this.player.trigger('play');
  this.player.trigger('playing');
  this.player.trigger('loadstart');
  this.player.trigger('canplay');
  this.clock.tick(10);

  assert.ok(spy.calledOnce, 'with a source, got a "sourcechanged" event');

  metaData = spy.getCall(0).args[1];
  assert.strictEqual(metaData.from, undefined);
  assert.strictEqual(metaData.to, 'x-1.mp4');
  assert.strictEqual(metaData.interimEvents.length, 4);
  assert.strictEqual(metaData.interimEvents[0].time, 11);
  assert.strictEqual(metaData.interimEvents[0].event.type, 'play');
  assert.strictEqual(metaData.interimEvents[1].time, 11);
  assert.strictEqual(metaData.interimEvents[1].event.type, 'playing');
  assert.strictEqual(metaData.interimEvents[2].time, 11);
  assert.strictEqual(metaData.interimEvents[2].event.type, 'loadstart');
  assert.strictEqual(metaData.interimEvents[3].time, 11);
  assert.strictEqual(metaData.interimEvents[3].event.type, 'canplay');

  this.player.trigger('pause');
  this.player.trigger('emptied');
  this.player.trigger('abort');
  this.player.trigger('loadstart');
  this.clock.tick(10);

  assert.ok(
    spy.calledOnce,
    'subsequent events with same source do not trigger "sourcechanged"'
  );

  this.player.currentSrc = () => 'x-2.mp4';
  this.player.trigger('loadedmetadata');
  this.player.trigger('loadeddata');
  this.player.trigger('loadstart');
  this.clock.tick(10);

  assert.ok(spy.calledTwice, 'with a new source, got a "sourcechanged" event');

  metaData = spy.getCall(1).args[1];
  assert.strictEqual(metaData.from, 'x-1.mp4');
  assert.strictEqual(metaData.to, 'x-2.mp4');
  assert.strictEqual(metaData.interimEvents.length, 3);
  assert.strictEqual(metaData.interimEvents[0].time, 31);
  assert.strictEqual(metaData.interimEvents[0].event.type, 'loadedmetadata');
  assert.strictEqual(metaData.interimEvents[1].time, 31);
  assert.strictEqual(metaData.interimEvents[1].event.type, 'loadeddata');
  assert.strictEqual(metaData.interimEvents[2].time, 31);
  assert.strictEqual(metaData.interimEvents[2].event.type, 'loadstart');

  this.player.currentSrc = () => 'x-1.mp4';
  this.player.trigger('play');
  this.player.trigger('canplay');
  this.player.trigger('loadstart');
  this.clock.tick(10);

  assert.ok(
    spy.calledThrice,
    'with a changed, but repeated, source, got a "sourcechanged" event'
  );

  metaData = spy.getCall(2).args[1];
  assert.strictEqual(metaData.from, 'x-2.mp4');
  assert.strictEqual(metaData.to, 'x-1.mp4');
  assert.strictEqual(metaData.interimEvents.length, 3);
  assert.strictEqual(metaData.interimEvents[0].time, 41);
  assert.strictEqual(metaData.interimEvents[0].event.type, 'play');
  assert.strictEqual(metaData.interimEvents[1].time, 41);
  assert.strictEqual(metaData.interimEvents[1].event.type, 'canplay');
  assert.strictEqual(metaData.interimEvents[2].time, 41);
  assert.strictEqual(metaData.interimEvents[2].event.type, 'loadstart');

  // @todo
  // What can/should, if anything, we do about a situation where a source was
  // changed to a new source, but no events were fired; then it changed BACK
  // to the original source? Is that event possible? Seems like it'd be worth
  // investigating at some point.
});
