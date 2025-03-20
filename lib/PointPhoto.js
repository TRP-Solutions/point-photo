/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/TRP-Solutions/boot-some/blob/master/LICENSE
*/
var PointPhoto = (function(){
	var active_camera = undefined;

	function getCamera(elem){
		if(!active_camera){
			var container = document.querySelector('.pointphoto-camera');
			if(container){
				active_camera = {
					'container': container,
					'video': container.querySelector('video'),
					'overlay': container.querySelector('img'),
					'canvas': container.querySelector('canvas'),
					'loading': container.querySelector('.pointphoto-camera-loading'),
					'orientation': 'landscape',
					'facing_mode': 'environment'
				}
			}
		}
		if(elem) {
			var image = elem.closest('.pointphoto-image');
			if(image){
				active_camera.image = image;
				active_camera.preview = image.querySelector('.pointphoto-image-preview');
			}
		}
		return active_camera;
	}

	function open(elem){
		var camera = getCamera(elem);
		if(!camera) return;
		camera.container.dataset.pointphotoState = 'loading';
		camera.container.dispatchEvent(new Event('pointphoto-open'));

		camera.overlay.onload = function(){
			this.style.setProperty('--pointphoto-overlay-ratio', this.naturalWidth/this.naturalHeight);
		}

		camera.video.onloadedmetadata = function(){
			if(camera.image.dataset.pointphotoOverlay){
				camera.overlay.src = camera.image.dataset.pointphotoOverlay;
			}
			camera.video.play();
			if(camera.video.videoWidth < camera.video.videoHeight){
				camera.container.dataset.pointphotoOrientation = 'portrait';
			} else {
				camera.container.dataset.pointphotoOrientation = 'landscape';
			}
			window.addEventListener('resize',rotate_camera_modal);
			camera.container.dataset.pointphotoState = 'active';
		};

		PointPhotoStream.set(camera.video, camera.facing_mode);
	}

	function rotate_camera_modal(){
		if(!active_camera){
			window.removeEventListener('resize',rotate_camera_modal);
			return;
		}
		if(active_camera.video.videoWidth < active_camera.video.videoHeight){
			active_camera.container.dataset.pointphotoOrientation = 'portrait';
		} else {
			active_camera.container.dataset.pointphotoOrientation = 'landscape';
		}
	}

	function swap_camera(){
		if(!active_camera){
			return;
		}
		if(active_camera.facing_mode == 'environment'){
			active_camera.facing_mode = 'user';
		} else {
			active_camera.facing_mode = 'environment';
		}
		PointPhotoStream.swap(active_camera.facing_mode);
	}

	function close(reuse){
		if(!active_camera){
			return;
		}
		PointPhotoStream.close(reuse);
		var container = active_camera.container;
		active_camera = undefined;
		container.dataset.pointphotoState = 'inactive';
		container.dispatchEvent(new Event('pointphoto-close'));
	}

	function snapshot(){
		var camera = getCamera();
		if(!camera) return;
		PointPhotoStream.snapshot(camera.canvas,camera.preview);
		image_added(camera.image, 'camera');
		close();
	}

	function local_file(elem){
		var image = elem.closest('.pointphoto-image');
		var file_input = image.querySelector('input[type=file][data-pointphoto=upload]');
		file_input.onchange = on_local_file_upload;
		file_input.click();
	}

	function on_local_file_upload(){
		if(this.files[0]){
			var image = this.closest('.pointphoto-image');
			if(!image){
				return;
			}
			var preview = image.querySelector('.pointphoto-image-preview');
			var reader = new FileReader();
			reader.onloadend = function(){
				preview.src = reader.result;
				image_added(image, 'local');
			}
			reader.readAsDataURL(this.files[0]);
		}
	}

	function get_formdata(context){
		var images = (context||document).querySelector('.pointphoto-image:not([data-image-source=preset])');
		var formdata = new FormData();
		var missing_required_images = false;
		for(var i = 0; i < images; i++){
			var img = images[i].querySelector('img.pointphoto-image-preview');
			if(img && img.src && img.src.substring(0,5) == 'data:'){
				formdata.set('pointphoto-image['+images[i].dataset.pointphotoName+']',images[i].src);
			} else {
				if(warn_required(images[i])){
					images_missing = true;
				}
			}
		}
		if(missing_required_images){
			return false;
		} else {
			return formdata;
		}
	}

	function to_wildfile_chunked_upload(elem){
		if(typeof WildFile != 'object' || typeof WildFile.ChunkedFile != 'function'){
			return;
		}
		var image = elem.closest('.pointphoto-image');
		if(!image){
			return;
		}
		if(image.dataset.pointphotoSource == 'local'){
			var file_input = image.querySelector('input[type=file][data-pointphoto=upload]');
			if(file_input && file_input.files[0]){
				return new Promise(function(resolve,reject){resolve(new WildFile.ChunkedFile(file_input.files[0]));});
			}
		} else if(image.dataset.pointphotoSource == 'camera'){
			var img = image.querySelector('img.pointphoto-image-preview');
			if(img && img.pointphoto_image_blob){
				return img.pointphoto_image_blob.then(function(blob){
					var suffix = blob.type == 'image/jpeg' ? '.jpg' : '.png';
					return new WildFile.ChunkedFile(new File([blob],image.dataset.pointphotoName+suffix,{'type':blob.type}));
				});
			}
		}
	}

	function warn_required(elem, force_warning){
		var image = elem.closest('.pointphoto-image');
		if(
			(image.dataset.pointphotoRequired == 'required' && image.dataset.pointphotoState != 'image')
			|| force_warning
		){
			image.dataset.pointphotoWarning = 'required';
			return true;
		} else {
			return false;
		}
	}

	function remove_warning(elem){
		var image = elem.closest('.pointphoto-image');
		delete image.dataset.pointphotoWarning;
	}

	function image_added(container, source){
		container.dataset.pointphotoState = 'image';
		container.dataset.pointphotoSource = source;
		var clear_button = container.querySelector('[data-pointphoto=clear-button]');
		clear_button.disabled = false;
		remove_warning(container);
		container.dispatchEvent(new Event('pointphoto-image-added'));
	}

	function clear(clear_button){
		var image = clear_button.closest('.pointphoto-image');
		if(!image){
			return;
		}
		
		var preview = image.querySelector('.pointphoto-image-preview');
		if(image.dataset.pointphotoPreset){
			image.dataset.pointphotoState = 'image';
			image.dataset.pointphotoSource = 'preset';
			preview.src = image.dataset.pointphotoPreset;
		} else {
			image.dataset.pointphotoState = 'empty';
			image.dataset.pointphotoSource = '';
			preview.src = image.dataset.pointphotoPreset || image.dataset.pointphotoOverlay || '';
		}
		clear_button.disabled = true;
		image.dispatchEvent(new Event('pointphoto-image-removed'));
	}

	return {
		open: open,
		swap_camera: swap_camera,
		close: close,
		snapshot: snapshot,
		local_file: local_file,
		get_formdata: get_formdata,
		to_wildfile_chunked_upload: to_wildfile_chunked_upload,
		clear: clear,
		warn_required: warn_required,
		remove_warning: remove_warning
	}
})()

var PointPhotoStream = (function(){
	var streamObject, streamPromise, activeVideo;

	function setStream(video, facing){
		if(!video) return;

		if(activeVideo){
			PointPhoto.close(true);
		}

		if(streamObject){
			video.srcObject = streamObject;
			activeVideo = video;
			return
		}

		if(streamPromise) return;

		streamPromise = navigator.mediaDevices.getUserMedia({video:{width:{min:640,ideal:1280,max:1920},facingMode:{ideal:facing}},audio:false});
		streamPromise.then(function(stream){
			streamObject = stream;
			streamPromise = undefined;
			setStream(video, facing);
		})
	}

	function swapStream(facing){
		if(!activeVideo || streamPromise) return;

		streamPromise = navigator.mediaDevices.getUserMedia({video:{width:{min:640,ideal:1280,max:1920},facingMode:{exact:facing}},audio:false});
		streamPromise.then(function(stream){
			streamPromise = undefined;
			activeVideo.srcObject = streamObject = stream;
		})
	}

	function snapshot(canvas, still){
		if(!activeVideo || !canvas) return;
		var context = canvas.getContext('2d');
		var width = activeVideo.videoWidth;
		var height = activeVideo.videoHeight;
		if(width < height){
			canvas.setAttribute('width',height);
			canvas.setAttribute('height',width);
			context.translate(0,width); //move origin, so rotation makes the image land on canvas
			context.rotate(1.5*Math.PI); //rotate 270 degrees aka 90 degrees counter-clockwise
		} else {
			canvas.setAttribute('width',width);
			canvas.setAttribute('height',height);
		}
		context.drawImage(activeVideo, 0, 0, width, height);
		still.src = canvas.toDataURL('image/jpeg',0.85);
		var resolve_image_blob = undefined;
		still.pointphoto_image_blob = new Promise(function(resolve,reject){
			resolve_image_blob = resolve;
		})
		canvas.toBlob(function(blob){
			if(blob){
				resolve_image_blob(blob);
			}
		},'image/jpeg',0.85);
	}

	function close(reuse){
		if(streamObject){
			if(!reuse){
				var tracks = streamObject.getTracks();
				for(var i=0;i < tracks.length; i++){
					tracks[i].stop()
				}
			}
			activeVideo.srcObject = undefined;
			streamObject = undefined;
			activeVideo = undefined;
			return
		}

		if(streamPromise){
			streamPromise.then(function(){
				close(reuse);
			})
			streamPromise = undefined;
		}
	}

	return {
		set: setStream,
		swap: swapStream,
		snapshot: snapshot,
		close: close
	}
})()
