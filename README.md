# videojs-per-source-behaviors

[![Build Status](https://travis-ci.org/brightcove/videojs-per-source-behaviors.svg?branch=master)](https://travis-ci.org/brightcove/videojs-per-source-behaviors)
[![Greenkeeper badge](https://badges.greenkeeper.io/brightcove/videojs-per-source-behaviors.svg)](https://greenkeeper.io/)
[![Slack Status](http://slack.videojs.com/badge.svg)](http://slack.videojs.com)

[![NPM](https://nodei.co/npm/videojs-per-source-behaviors.png?downloads=true&downloadRank=true)](https://nodei.co/npm/videojs-per-source-behaviors/)

A video.js plugin for enhancing a player with behaviors related to changing media sources.

Maintenance Status: Stable

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Why?](#why)
- [Installation](#installation)
- [Usage](#usage)
  - [`<script>` Tag](#script-tag)
  - [Browserify](#browserify)
  - [RequireJS/AMD](#requirejsamd)
- [API](#api)
  - [`sourceunstable` Event](#sourceunstable-event)
  - [`sourcechanged` Event](#sourcechanged-event)
    - [Extra Event Data](#extra-event-data)
  - [`player.onPerSrc()`](#playeronpersrc)
  - [`player.onePerSrc()`](#playeronepersrc)
  - [`player.perSourceBehaviors.disable()`/`player.perSourceBehaviors.enable()`](#playerpersourcebehaviorsdisableplayerpersourcebehaviorsenable)
    - [What happens when per-source behaviors are disabled?](#what-happens-when-per-source-behaviors-are-disabled)
  - [`player.perSourceBehaviors.disabled()`/`player.perSourceBehaviors.enabled()`](#playerpersourcebehaviorsdisabledplayerpersourcebehaviorsenabled)
  - [`player.perSourceBehaviors.VERSION`](#playerpersourcebehaviorsversion)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Why?

Detecting when the media source of a player has changed or is about to change is an inexact operation because the resource selection algorithm is asynchronous.

For the most part, Video.js users will be familiar with using the `Player#src()` method to change the source of the player. One might wonder why we don't simply trigger an event from that function to signal that the source is going to change.

The problem with that is that `src()` is not the only way to change the source. The underlying `<video>` element has multiple methods of changing the source as well and we aim to support those here.

This plugin provides events and other tools that aim to make that uncertainty a little less daunting.

## Installation

```sh
npm install --save videojs-per-source-behaviors
```

The npm installation is preferred, but Bower works, too.

```sh
bower install  --save videojs-per-source-behaviors
```

## Usage

To include videojs-per-source-behaviors on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-per-source-behaviors.min.js"></script>
<script>
  var player = videojs('my-video');

  player.perSourceBehaviors();
</script>
```

### Browserify

When using with Browserify, install videojs-per-source-behaviors via npm and `require` the plugin as you would any other module.

```js
var videojs = require('video.js');

// The actual plugin function is exported by this module, but it is also
// attached to the `Player.prototype`; so, there is no need to assign it
// to a variable.
require('videojs-per-source-behaviors');

var player = videojs('my-video');

player.perSourceBehaviors();
```

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the plugin as you normally would:

```js
require(['video.js', 'videojs-per-source-behaviors'], function(videojs) {
  var player = videojs('my-video');

  player.perSourceBehaviors();
});
```

## API

Once the plugin is invoked on a player - by calling `player.perSourceBehaviors()` - it begins firing a new event, gains two new methods, and replaces `perSourceBehaviors` with an object.

### `sourceunstable` Event

The `sourceunstable` event will be fired when the plugin detects a condition that suggests the video player is in the process of changing sources, but that it's too early to know what the new source is or will be.

This is not a guarantee that the source will even change, but it's close - and one of the goals of this project is to continually improve this detection.

### `sourcechanged` Event

The `sourcechanged` event will be fired once the call stack is cleared after the first of a subset of standard [`HTMLMediaElement` events][standard-events] is encountered where the `currentSrc()` returned by the player has changed from the previously cached value.

| previous src | current src | ad state | triggered? |
|:------------:|:-----------:|:--------:|:----------:|
| null | null | :x: | :x: |
| null | foo.mp4 | :x: | :white_check_mark: |
| null | ad.mp4 | :white_check_mark: | :x: |
| foo.mp4 | foo.mp4 | :x: | :x: |
| foo.mp4 | foo.mp4 | :white_check_mark: | :x: |
| foo.mp4 | bar.mp4 | :x: | :white_check_mark: |
| foo.mp4 | bar.mp4 | :white_check_mark: | :x: |
| foo.mp4 | ad.mp4 | :white_check_mark: | :x: |
| ad.mp4 | foo.mp4 | :white_check_mark: | :x: |

#### Extra Event Data

An object with the following properties is passed along with `sourcechanged` events as the second argument to any listeners:

- `from`: The source URL _before_ the event.
- `to`: The source URL _after_ the event (and currently).
- `interimEvents`: An array of _all_ the events that occurred in the player between the event that triggered the check to the last event that fired before the call stack cleared.

Put another way, the object follows the following schema:

```js
{
  from: <String>,
  to: <String>,
  interimEvents: [{
    time: <Number>,
    event: <Event>
  }, ...]
}
```

### `player.onPerSrc()`

The `onPerSrc()` method has the same behavior as `on()` with the crucial exception that it will unbind itself if the listener is ever called with a different source than when it was bound.

Additionally, these listeners will be removed immediately before the plugin triggers a `sourcechanged` event. This is done because one of the core use-cases is adding new per-source listeners on the `sourcechanged` event and there is a chance they can double-up otherwise.

### `player.onePerSrc()`

The `onePerSrc()` method has the same behavior as `onPerSrc()` except that it can only be called _once_.

### `player.perSourceBehaviors.disable()`/`player.perSourceBehaviors.enable()`

These methods will disable and enable (respectively) the per-source behaviors on this player.

This is useful in more complex use-cases where you might want to manipulate the player state without triggering per-source behaviors. A good example of this might be advertising playback.

#### What happens when per-source behaviors are disabled?

- The `sourcechanged` event will not be fired even if the source changes.
- Any `onPerSrc()`/`onePerSrc()` listeners will not be called.
- Binding new `onPerSrc()`/`onePerSrc()` listeners will be prevented.

### `player.perSourceBehaviors.disabled()`/`player.perSourceBehaviors.enabled()`

Use these methods to inspect the current enabled/disabled state of the player as pertains to per-source behaviors. Both return a `Boolean`.

### `player.perSourceBehaviors.VERSION`

Exposes the semantic version number of the plugin. This is also exposed on the plugin function (i.e. `videojs.getComponent('Player').prototype.perSourceBehaviors`).

## License

Apache-2.0. Copyright (c) Brightcove, Inc.


[standard-events]: https://www.w3.org/TR/html5/embedded-content-0.html#mediaevents
[videojs]: http://videojs.com/
