<a name="3.0.1"></a>
## [3.0.1](https://github.com/brightcove/videojs-per-source-behaviors/compare/v3.0.0...v3.0.1) (2024-02-03)

### Bug Fixes

* clear deprecation warning when using with Video.js 8 (#51) ([a3247b6](https://github.com/brightcove/videojs-per-source-behaviors/commit/a3247b6)), closes [#51](https://github.com/brightcove/videojs-per-source-behaviors/issues/51)
* **test:** remove FirefoxHeadless ([7f1533d](https://github.com/brightcove/videojs-per-source-behaviors/commit/7f1533d))

<a name="3.0.0"></a>
# [3.0.0](https://github.com/brightcove/videojs-per-source-behaviors/compare/v2.1.0...v3.0.0) (2021-12-17)

### Chores

* package-lock updates (#50) ([68f1976](https://github.com/brightcove/videojs-per-source-behaviors/commit/68f1976)), closes [#50](https://github.com/brightcove/videojs-per-source-behaviors/issues/50)
* skip vjsverify es check (#49) ([4d65c8c](https://github.com/brightcove/videojs-per-source-behaviors/commit/4d65c8c)), closes [#49](https://github.com/brightcove/videojs-per-source-behaviors/issues/49)
* Update generate-rollup-config to drop older browser support (#47) ([fa7a13f](https://github.com/brightcove/videojs-per-source-behaviors/commit/fa7a13f)), closes [#47](https://github.com/brightcove/videojs-per-source-behaviors/issues/47)


### BREAKING CHANGES

* This removes support for some older browsers like IE 11

<a name="2.1.0"></a>
# [2.1.0](https://github.com/brightcove/videojs-per-source-behaviors/compare/v2.0.1...v2.1.0) (2018-12-18)

### Features

* Add support for contrib-ads 6 or 5. (#40) ([e3a0d62](https://github.com/brightcove/videojs-per-source-behaviors/commit/e3a0d62)), closes [#40](https://github.com/brightcove/videojs-per-source-behaviors/issues/40)

<a name="2.0.1"></a>
## [2.0.1](https://github.com/brightcove/videojs-per-source-behaviors/compare/v2.0.0...v2.0.1) (2018-09-18)

### Bug Fixes

* Remove the postinstall script to prevent install issues (#17) ([202bfb1](https://github.com/brightcove/videojs-per-source-behaviors/commit/202bfb1)), closes [#17](https://github.com/brightcove/videojs-per-source-behaviors/issues/17)
* report version on plugin (#20) ([f535b07](https://github.com/brightcove/videojs-per-source-behaviors/commit/f535b07)), closes [#20](https://github.com/brightcove/videojs-per-source-behaviors/issues/20)

### Chores

* update generator to v7.1.1 ([679a980](https://github.com/brightcove/videojs-per-source-behaviors/commit/679a980))
* **package:** Update dependencies (#14) ([2bba1b3](https://github.com/brightcove/videojs-per-source-behaviors/commit/2bba1b3)), closes [#14](https://github.com/brightcove/videojs-per-source-behaviors/issues/14)
* update to generator-videojs-plugin[@7](https://github.com/7).2.0 ([02c5eb1](https://github.com/brightcove/videojs-per-source-behaviors/commit/02c5eb1))
* Update to use plugin generator v7.0.2 ([ad31b02](https://github.com/brightcove/videojs-per-source-behaviors/commit/ad31b02))
* **package:** update videojs-generate-karma-config to version 3.0.0 (#16) ([1d81b2d](https://github.com/brightcove/videojs-per-source-behaviors/commit/1d81b2d)), closes [#16](https://github.com/brightcove/videojs-per-source-behaviors/issues/16)
* **package:** update videojs-generate-rollup-config to version 2.1.0 (#15) ([eef3991](https://github.com/brightcove/videojs-per-source-behaviors/commit/eef3991)), closes [#15](https://github.com/brightcove/videojs-per-source-behaviors/issues/15)
* **package:** update videojs-generate-rollup-config to version 2.2.0 (#18) ([1129e27](https://github.com/brightcove/videojs-per-source-behaviors/commit/1129e27)), closes [#18](https://github.com/brightcove/videojs-per-source-behaviors/issues/18)

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
