# PointPhoto

PointPhoto is comprised of the javascript files `lib/PointPhoto.js` and `lib/PointPhotoImage.js`

```JavaScript
PointPhotoImage.init(options);
```
`init` takes an object with optional members: `camera`, `album`, `facing`, `orientation`.

* `camera` is either a `PointPhoto` or an element on the page, which is then used to generate a new `PointPhoto` and will have its contents replaced.
* `album` is either a `NodeList` or an array of elements on the page. The given elements are used to generate new `PointPhotoImage` instances and will have their contents replaced.
* `facing` is forwarded to the `PointPhoto` constructor, if a new camera is constructed.
* `orientation` is forwarded to the `PointPhoto` constructor, if a new camera is constructed.

## PointPhoto.js
```JavaScript
var camera = new PointPhoto(container, options);
```

* `container` an element on the page, which will have its contents replaced.
* `options` is an object with optional members: `facing`, `orientation`.
	* `facing` is either `"user"` or `"environment"` and determines which physical camera is requested access to first. Defaults to `"environment"`.
	* `orientation` is either `"landscape"` or `"portrait"`. If set, controls the placement of the camera buttons and rotates any captured image to fit the requested orientation.

### Customization

To customize the subcomponents of PointPhoto, replace these functions on the `PointPhoto` object. `.create_button(...)` uses `.create_icon(...)`.

* `PointPhoto.create_button(name, onclick, type, disabled)`
* `PointPhoto.create_icon(name)`
* `PointPhoto.create_camera_loading()`


## PointPhotoImage.js
`PointPhotoImage` uses the following data attributes on the HTML element:

* `data-name` : An optional name of the file input generated. Defaults to `pointphoto[]`.
* `data-preset` : An optional URL of a preset image.
* `data-required` : If present, marks the image as required, which can be used to trigger a warning if there is no file added, image captured, or preset defined.

### Customization

To customize the subcomponents of PointPhotoImage, replace these functions on the `PointPhotoImage` object. `.create_button(...)` uses `.create_icon(...)`.

* `PointPhotoImage.create_button(name, onclick, type, disabled)`
* `PointPhotoImage.create_icon(name)`
* `PointPhotoImage.create_warning()`


# Example
```JavaScript
(new PointPhoto(document.querySelector('#camera'))).open('filename', handle_file);

function handle_file(file){
	// ...
}
```