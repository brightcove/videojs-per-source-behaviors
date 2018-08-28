<a name="2.0.0"></a>
# 2.0.0 (2017-05-19)

### Chores

* Update tooling using generator v5 prerelease. (#9) ([97d1e06](https://github.com/brightcove/videojs-per-source-behaviors/commit/97d1e06))

### BREAKING CHANGES

* Removed Bower support.

## 1.1.4 (2017-04-27)
* add `"ads-ready?"` as a known state

## 1.1.3 (2017-03-23)
* Remove `"ads-ready"` from list of considered ad states.

## 1.1.2 (2017-02-27)
* Remove per-src listeners when we know the source changed.

## 1.1.1 (2017-02-10)
* Video.js 5/6 cross-compatibility.

## 1.1.0 (2017-01-31)
* Added `"sourceunstable"` event.

## 1.0.0 (2016-06-21)
* Added `"sourcechanged"` event to a video.js player.
* Added `onPerSrc()` and `onePerSrc()` methods to a video.js player.
