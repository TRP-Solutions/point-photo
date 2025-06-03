# PointPhoto

PointPhoto is comprised of a javascript file `lib/PointPhoto.js` and a css file `lib/PointPhoto.css`

```
PointPhoto.init();
```
`init` will find all elements on the page with the classname `pointphoto-image` and append generated `div`, `img`, `input`, and `button` elements and create a `PointPhotoImage` object for each of them.

Clicking the camera button of a `PointPhotoImage` will find the first element with the classname `pointphoto-camera` and append generated elements and create a `PointPhotoCamera` object.

## PointPhotoImage
`PointPhotoImage` uses the following data attributes on the HTML element:

* `data-overlay` : An optional URL of an overlay image for the camera.
* `data-name` : An optional name of the file input generated. Defaults to `pointphoto[]`.
* `data-preset` : An optional URL of a preset image.
* `data-required` : If present, marks the image as required, which can be used to trigger a warning if there is no file added, image captured, or preset defined.


## PointPhotoCamera
`PointPhotoCamera` uses the following data attributes on the HTML element:

* `data-opacity` : A optional floating point number larger than 0 and smaller than 1. If present, set the opacity of the overlay image.

# Custom Styling
The following classes are used:

* `.pointphoto-camera`
* `.pointphoto-camera-viewer`
* `.pointphoto-camera-controls`
* `.pointphoto-camera-leading`
* `.pointphoto-image`
* `.pointphoto-warning`
* `.pointphoto-hidden`

The following data attributes are used:

* `.pointphoto-camera[data-pointphoto-state]`: one of `inactive`, `loading`, `active`
* `.pointphoto-camera[data-pointphoto-orientation]`: one of `portrait`, `landscape`
* `.pointphoto-image[data-pointphoto-state]`: one of `image`, `preset`, `empty`
* `.pointphoto-image[data-pointphoto-warning]`: always `required` if present
