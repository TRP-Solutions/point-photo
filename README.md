# PointPhoto

PointPhoto is comprised of a javascript file `lib/PointPhoto.js` and a css file `lib/PointPhoto.css`

```JavaScript
PointPhoto.init(options);
```
`init` takes an object with optional members: `camera`, `album`, `facing`, `orientation`.

* `camera` is either a `PointPhotoCamera` or an element on the page, which is then used to generate a new `PointPhotoCamera` and will have its contents replaced.
* `album` is either a `NodeList` or an array of elements on the page. The given elements are used to generate new `PointPhotoImage` instances and will have their contents replaced.
* `facing` is forwarded to the `PointPhotoCamera` constructor, if a new camera is constructed.
* `orientation` is forwarded to the `PointPhotoCamera` constructor, if a new camera is constructed.

## PointPhotoImage
`PointPhotoImage` uses the following data attributes on the HTML element:

* `data-name` : An optional name of the file input generated. Defaults to `pointphoto[]`.
* `data-preset` : An optional URL of a preset image.
* `data-required` : If present, marks the image as required, which can be used to trigger a warning if there is no file added, image captured, or preset defined.


## PointPhotoCamera
```JavaScript
var camera = new PointPhotoCamera(container, options);
```

* `container` an element on the page, which will have its contents replaced.
* `options` is an object with optional members: `facing`, `orientation`.
	* `facing` is either `"user"` or `"environment"` and determines which physical camera is requested access to first. Defaults to `"environment"`.
	* `orientation` is either `"landscape"` or `"portrait"`. If set, controls the placement of the camera buttons and rotates any captured image to fit the requested orientation.

# Customization

To customize the subcomponents of PointPhoto, replace these functions on the `PointPhoto` object.

* `PointPhoto.create_button(name, onclick, type, disabled)`
* `PointPhoto.create_icon(name)`
* `PointPhoto.create_warning()`
* `PointPhoto.create_camera_loading()`

## Example
```JavaScript
(new PointPhotoCamera(document.querySelector('#camera'))).open('filename', handle_file);

function handle_file(file){
	// ...
}
```