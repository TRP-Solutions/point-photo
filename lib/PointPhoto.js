/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/TRP-Solutions/boot-some/blob/master/LICENSE
*/

var PointPhoto = (function(){
	var active_camera = undefined;
	var stream = {
		source: undefined,
		promise: undefined,
		video: undefined,
	}

	function stream_set(video, facing){
		if(!video) return;
		if(stream.video){
			close(true);
		}
		stream.video = video;
		if(stream.source){
			video.srcObject = stream.source;
		} else {
			stream_get_media(facing);
		}
	}

	function stream_get_media(facing){
		if(!stream.video || stream.promise) return;
		stream.promise = navigator.mediaDevices.getUserMedia({
			video:{
				width:{min:640,ideal:1280,max:1920},
				facingMode:{ideal:facing}
			},
			audio:false
		}).then(source => {
			stream.promise = undefined;
			stream.video.srcObject = stream.source = source;
		});
	}

	function stream_snapshot(canvas){
		if(!stream.video || !canvas) return;
		var context = canvas.getContext('2d');
		var width = stream.video.videoWidth;
		var height = stream.video.videoHeight;
		if(width < height){
			canvas.setAttribute('width',height);
			canvas.setAttribute('height',width);
			context.translate(0,width); //move origin, so rotation makes the image land on canvas
			context.rotate(1.5*Math.PI); //rotate 270 degrees aka 90 degrees counter-clockwise
		} else {
			canvas.setAttribute('width',width);
			canvas.setAttribute('height',height);
		}
		context.drawImage(stream.video, 0, 0, width, height);
	}

	function stream_close(reuse){
		stream_stop(reuse);
		if(stream.promise){
			stream.promise.then(() => stream_stop(reuse));
			stream.promise = undefined;
		}
	}

	function stream_stop(reuse){
		if(stream.source){
			if(!reuse){
				stream.source.getTracks().forEach(track => track.stop());
			}
			stream.source = undefined;
			stream.video.srcObject = undefined;
			stream.video = undefined;
		}
	}

	function init(options){
		image_all(undefined, true);
	}

	function get_camera(){
		if(!active_camera){
			var container = document.querySelector('.pointphoto-camera');
			if(!container){
				return;
			}
			active_camera = new PointPhotoCamera(container);
		}
		return active_camera;
	}

	function close(reuse){
		if(active_camera){
			var camera = active_camera;
			active_camera = undefined;
			camera.close(reuse);
		}
	}

	function image_all(callback, initialize){
		var images = document.querySelectorAll('.pointphoto-image');
		images.forEach(image => {
			if(initialize && !image.PointPhotoImageInstance){
				image.PointPhotoImageInstance = new PointPhotoImage(image);
			}
			if(callback && image.PointPhotoImageInstance){
				callback(image.PointPhotoImageInstance);
			}
		});
	}

	function create_element(tag, classname, ...children){
		var element = document.createElement(tag);
		element.classList.add(classname);
		element.replaceChildren(...children);
		return element;
	}

	function create_button(name, onclick, type, disabled){
		var button = document.createElement('button');
		if(type == 'danger'){
			button.classList.add('pointphoto-button-danger');
		} else {
			button.classList.add('pointphoto-button');
		}
		button.setAttribute('type','button');
		button.addEventListener('click',onclick);
		button.replaceChildren(PointPhoto.create_icon(name));
		if(disabled){
			button.disabled = true;
			button.style.display = 'none';
		}
		return button;
	}

	function create_icon(name){
		var span = document.createElement('span');
		span.textContent = name;
		return span;
	}

	function create_video(container){
		var video = document.createElement('video');
		video.setAttribute('autoplay','');
		video.setAttribute('muted','');
		video.setAttribute('playsinline','');
		video.addEventListener('loadedmetadata',()=>{
			video.play();
			container.dataset.pointphotoOrientation = video.videoWidth < video.videoHeight ? 'portrait' : 'landscape';
			container.dataset.pointphotoState = 'active';
		});
		video.addEventListener('resize',()=>{
			container.dataset.pointphotoOrientation = video.videoWidth < video.videoHeight ? 'portrait' : 'landscape';
		});
		return video;
	}

	function create_overlay(opacity){
		var img = document.createElement('img');
		img.addEventListener('load',()=>img.style.setProperty('--poinphoto-overlay-ratio', img.naturalWidth / img.naturalHeight));
		if(typeof opacity == 'string'){
			opacity = Number(opacity);
		}
		if(typeof opacity == 'number' && 0 < opacity && opacity < 1){
			img.style.opacity = opacity.toFixed(2);
		}
		return img;
	}

	function create_file_input(name, set_file_object){
		var input = document.createElement('input');
		input.classList.add('pointphoto-hidden');
		input.type = 'file';
		if(name){
			input.name = name;
		}
		input.addEventListener('change',()=>set_file_object(input.files[0], 'file_input'));
		return input;
	}


	function PointPhotoCamera(container){
		var private = {
			container: container,
			image: undefined,
			file_name: undefined,
			file_callback: undefined,
			file_object: undefined,
			facing_mode: 'environment',
			video: create_video(container),
			canvas: create_element('canvas', 'pointphoto-hidden'),
			overlay: create_overlay(container.dataset.opacity),
		}

		private.container.classList.add('pointphoto-camera');
		private.container.dataset.pointphotoState = 'inactive';
		private.container.dataset.pointphotoOrientation = 'landscape';

		private.container.replaceChildren(
			create_element(
				'div',
				'pointphoto-camera-viewer',
				create_element('div','pointphoto-camera-loading',PointPhoto.create_icon('loading')),
				private.video,
				private.canvas,
				private.overlay
			),
			create_element(
				'div',
				'pointphoto-camera-controls',
				PointPhoto.create_button('snapshot', ()=>this.snapshot()),
				PointPhoto.create_button('swap_camera', ()=>this.swap_camera()),
				PointPhoto.create_button('close', ()=>this.close(), 'danger'),
			),
		);

		function blob_to_file(blob){
			var suffix = blob.type == 'image/jpeg' ? '.jpg' : '.png';
			var file_name = private.file_name + suffix;
			var file = new File([blob],file_name,{'type':blob.type});
			if(private.file_callback){
				private.file_callback(file);
				private.file_object = undefined;
			} else {
				private.file_object = file;
			}
		}

		this.open = function open(image, overlay_src, file_name, file_callback){
			private.image = image;
			private.file_name = file_name;
			private.file_callback = file_callback;
			if(overlay_src){
				private.overlay.src = overlay_src;
			} else {
				private.overlay.removeAttribute('src');
			}
			private.container.dataset.pointphotoState = 'loading';
			private.container.dispatchEvent(new Event('pointphoto-open'));
			stream_set(private.video, private.facing_mode);
		}

		this.close = function close(reuse){
			stream_close(reuse);
			private.container.dataset.pointphotoState = 'inactive';
			private.container.dispatchEvent(new Event('pointphoto-close'));
		}

		this.swap_camera = function swap_camera(){
			private.facing_mode = private.facing_mode == 'environment' ? 'user' : 'environment';
			stream_get_media(private.facing_mode);
		}

		this.snapshot = function snapshot(){
			stream_snapshot(private.canvas);
			private.canvas.toBlob(blob_to_file,'image/jpeg',0.85);
			this.close();
			return private.file_object;
		}
	}

	function PointPhotoImage(container){
		var overlay_src = container.dataset.pointphotoOverlay || '';
		var input_name = container.dataset.pointphotoName || 'pointphoto[]';
		var private = {
			container: container,
			file_source: undefined,
			file_object: undefined,
			file_object_url: undefined,
			file_input: create_file_input(input_name, set_file_object),
			preview: document.createElement('img'),
			clear_button: PointPhoto.create_button('clear', ()=>this.clear(), 'danger', true),
		};
		private.default_state = container.dataset.pointphotoPreset ? 'preset' : 'empty';
		private.default_preview_url = container.dataset.pointphotoPreset || overlay_src;

		private.container.dataset.pointphotoState = private.default_state;
		private.preview.src = private.default_preview_url;

		private.container.replaceChildren(
			private.file_input,
			private.preview,
			create_element(
				'div',
				'pointphoto-buttons',
				PointPhoto.create_button('camera', ()=>this.use_camera()),
				PointPhoto.create_button('upload', ()=>this.use_local()),
				private.clear_button,
			),
			create_element('div','pointphoto-warning',PointPhoto.create_icon('warning')),
		);

		function set_file_object(file, source){
			if(private.file_object_url){
				URL.revokeObjectURL(private.file_object_url);
			}
			if(file){
				private.file_source = source;
				private.file_object = file;
				private.file_object_url = URL.createObjectURL(file);

				if(source != 'file_input'){
					var datatransfer = new DataTransfer();
					datatransfer.items.add(file);
					private.file_input.files = datatransfer.files;
				}

				private.preview.src = private.file_object_url;
				private.container.dataset.pointphotoState = 'image';

				private.clear_button.disabled = false;
				private.clear_button.style.display = '';
				var event = new Event('pointphoto-image-added');
			} else {
				private.file_source = undefined;
				private.file_object_url = undefined;
				private.file_object = undefined;
				
				private.preview.src = private.default_preview_url;
				private.container.dataset.pointphotoState = private.default_state;

				private.clear_button.disabled = true;
				private.clear_button.style.display = 'none';
				event = new Event('pointphoto-image-removed');
			}
			delete private.container.dataset.pointphotoWarning;
			private.container.dispatchEvent(event);
		}

		this.use_camera = () => get_camera().open(this,overlay_src,input_name,file => set_file_object(file, 'camera'));
		this.use_local = ()=>private.file_input.click();
		this.clear = ()=>set_file_object();

		this.warn_required = function(force_warning){
			if(
				force_warning
				|| (
					private.container.dataset.pointphotoRequired == 'required'
					&& private.container.dataset.pointphotoState != 'image'
				)
			){
				private.container.dataset.pointphotoWarning = 'required';
				return true;
			} else {
				return false;
			}
		}

		this.remove_warning = function(){
			delete private.container.dataset.pointphotoWarning;
		}
	}

	return {
		init: init,
		camera: get_camera,
		close: close,
		warn_required_all: (force_warning, initialize) => image_all(image => image.warn_required(force_warning), initialize),
		remove_warning_all: (initialize) => image_all(image => image.remove_warning(), initialize),
		clear_all: (initialize) => image_all(image => image.clear(), initialize),
		create_icon: create_icon,
		create_button: create_button,
	}
})()
