# videojs-per-source-behaviors

A video.js plugin for enhancing a player with behaviors related to changing media sources.

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

### `"sourcechanged"` Event

The `"sourcechanged"` event will be fired once the call stack is cleared after the first of [a subset][subset-events] of standard [`HTMLMediaElement` events][standard-events] is encountered where the `currentSrc()` returned by the player has changed.

#### Extra Event Data

An object with the following properties is passed along with `"sourcechanged"` events as the second argument to any listeners:

- `from`: The source URL _before_ the event.
- `to`: The source URL _after_ the event (and currently).
- `interimEvents`: An array of _all_ the events that occurred in the player between the event that triggered the check to the last event that fired before the call stack cleared. 
  
##### Schema

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

### `player.onePerSrc()`

The `onePerSrc()` method has the same behavior as `onPerSrc()` except that it can only be called _once_.

### `player.perSourceBehaviors.disabled([value])`

Get/set whether or not per-source behaviors are enabled on the player.

Calling `player.perSourceBehaviors.disabled()` will return a `Boolean` indicating the disabled/enabled state of per-source behaviors.

Providing any `value` other than `undefined` will update the disabled/enabled state of per-source behaviors by casting the `value` to a `Boolean`.

This is useful in more complex use-cases where you might want to manipulate the player state without triggering per-source behaviors. A good example of this might be advertising playback.

#### What happens when per-source behaviors are disabled?

- The `"sourcechanged"` event will not be fired even if the source changes.
- Any `onPerSrc()`/`onePerSrc()` listeners will not be called.
- Binding new `onPerSrc()`/`onePerSrc()` listeners will be prevented.

### `player.perSourceBehaviors.VERSION`

Exposes the semantic version number of the plugin. This is also exposed on the plugin function (i.e. `videojs.getComponent('Player').prototype.perSourceBehaviors`).

## License

Apache-2.0. Copyright (c) Brightcove, Inc.


[standard-events]: https://www.w3.org/TR/html5/embedded-content-0.html#mediaevents
[subset-events]: https://github.com/brightcove/videojs-per-source-behaviors/blob/master/src/plugin.js#L13
[videojs]: http://videojs.com/
