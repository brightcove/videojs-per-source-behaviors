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

## License

Apache-2.0. Copyright (c) Brightcove, Inc.


[videojs]: http://videojs.com/
