/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/TRP-Solutions/point-photo/blob/main/LICENSE.txt
*/
"use strict";

function PointPhotoCamera(container){
	var internal = {
		container: container,
		file_name: undefined,
		file_callback: undefined,
		file_object: undefined,
		facing_mode: 'environment',
		video: create_video(container),
		canvas: document.createElement('canvas'),
		overlay: create_overlay(container.dataset.opacity),
	}

	internal.container.classList.add('pointphoto-camera');
	internal.container.dataset.pointphotoState = 'inactive';
	internal.container.dataset.pointphotoOrientation = 'landscape';
	internal.canvas_context2d = internal.canvas.getContext('2d');

	internal.container.replaceChildren(
		create_element(
			'div',
			'pointphoto-camera-viewer',
			create_element('div','pointphoto-camera-loading',PointPhoto.create_icon('loading')),
			internal.video,
			internal.overlay
		),
		create_element(
			'div',
			'pointphoto-camera-controls',
			PointPhoto.create_button('snapshot', ()=>this.snapshot()),
			PointPhoto.create_button('swap_camera', ()=>this.swap_camera()),
			PointPhoto.create_button('close', ()=>this.close(), 'danger'),
		),
	);

	internal.container.PointPhotoCameraInstance = this;

	function create_element(tag, classname, ...children){
		var element = document.createElement(tag);
		element.classList.add(classname);
		element.append(...children);
		return element;
	}

	function create_video(){
		var video = document.createElement('video');
		video.setAttribute('autoplay','');
		video.setAttribute('muted','');
		video.setAttribute('playsinline','');
		video.addEventListener('loadedmetadata',()=>{
			video.play();
			internal.container.dataset.pointphotoOrientation = video.videoWidth < video.videoHeight ? 'portrait' : 'landscape';
			internal.container.dataset.pointphotoState = 'active';
		});
		video.addEventListener('resize',()=>{
			internal.container.dataset.pointphotoOrientation = video.videoWidth < video.videoHeight ? 'portrait' : 'landscape';
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

	function blob_to_file(blob){
		var suffix = blob.type == 'image/jpeg' ? '.jpg' : '.png';
		var file_name = internal.file_name + suffix;
		var file = new File([blob],file_name,{'type':blob.type});
		if(internal.file_callback){
			internal.file_callback(file);
			internal.file_object = undefined;
		} else {
			internal.file_object = file;
		}
	}

	function camera_start(){
		var old_media = internal.media;
		var facing = internal.facing_mode;
		var new_media = {
			onload: function(source){
				if(old_media){
					media_stop(old_media);
				}
				internal.video.srcObject = source;
				this.source = source;
				this.onload = undefined;
			}
		}
		new_media.promise = navigator.mediaDevices.getUserMedia({
			video:{
				width:{min:640,ideal:1280,max:1920},
				facingMode:{ideal:facing}
			},
			audio:false
		}).then(source => {
			if(typeof new_media.onload == 'function'){
				new_media.onload(source);
			}
		});
		internal.media = new_media;
	}

	function media_stop(media){
		if(media.onload){
			media.onload = source => source.getTracks().forEach(track => track.stop());
		} else if(media.source){
			media.source.getTracks().forEach(track => track.stop());
		}
	}

	function camera_stop(){
		if(internal.media){
			media_stop(internal.media);
			internal.media = undefined;
		}
		if(internal.video){
			internal.video.srcObject = undefined;
		}
	}

	function camera_snapshot(){
		var width = internal.video.videoWidth;
		var height = internal.video.videoHeight;
		if(width < height){
			internal.canvas.setAttribute('width',height);
			internal.canvas.setAttribute('height',width);
			internal.canvas_context2d.translate(0,width); //move origin, so rotation makes the image land on canvas
			internal.canvas_context2d.rotate(1.5*Math.PI); //rotate 270 degrees aka 90 degrees counter-clockwise
		} else {
			internal.canvas.setAttribute('width',width);
			internal.canvas.setAttribute('height',height);
		}
		internal.canvas_context2d.drawImage(internal.video, 0, 0);
		internal.canvas.toBlob(blob_to_file,'image/jpeg',0.85);
	}

	this.open = function open(overlay_src, file_name, file_callback){
		internal.file_name = file_name;
		internal.file_callback = file_callback;
		if(overlay_src){
			internal.overlay.src = overlay_src;
		} else {
			internal.overlay.removeAttribute('src');
		}
		internal.container.dataset.pointphotoState = 'loading';
		internal.container.dispatchEvent(new Event('pointphoto-open'));
		camera_start();
	}

	this.close = function close(reuse){
		camera_stop();
		internal.container.dataset.pointphotoState = 'inactive';
		internal.container.dispatchEvent(new Event('pointphoto-close'));
	}

	this.swap_camera = function swap_camera(){
		internal.facing_mode = internal.facing_mode == 'environment' ? 'user' : 'environment';
		camera_start();
	}

	this.snapshot = function snapshot(){
		camera_snapshot();
		this.close();
		return internal.file_object;
	}
}

function PointPhotoImage(container, options){
	options = options || {};
	var overlay_src = options.overlay || container.dataset.pointphotoOverlay || '';
	var input_name = options.name || container.dataset.pointphotoName || 'pointphoto[]';

	var internal = {
		container: container,
		file_url: undefined,
		file_input: create_file_input(input_name, set_file_object),
		preview: document.createElement('img'),
		clear_button: PointPhoto.create_button('clear', ()=>this.clear(), 'danger', true),
		default_state: container.dataset.pointphotoPreset ? 'preset' : 'empty',
		default_preview_url: container.dataset.pointphotoPreset || overlay_src,
		default_camera: options.camera || false
	};

	var buttons = document.createElement('div');
	buttons.classList.add('pointphoto-buttons');
	if(internal.default_camera){
		buttons.append(PointPhoto.create_button('camera', ()=>this.use_camera()));
	}
	buttons.append(
		PointPhoto.create_button('upload', ()=>this.use_local()),
		internal.clear_button
	);

	internal.preview.src = internal.default_preview_url;
	internal.container.dataset.pointphotoState = internal.default_state;
	internal.container.replaceChildren(
		internal.file_input,
		internal.preview,
		buttons,
		PointPhoto.create_warning(),
	);

	function create_file_input(name, set_file_object){
		var input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		if(name){
			input.name = name;
		}
		input.addEventListener('change',()=>set_file_object(input.files[0], 'file_input'));
		return input;
	}

	function set_file_object(file, source){
		if(internal.file_url){
			URL.revokeObjectURL(internal.file_url);
		}
		if(file){
			internal.file_url = URL.createObjectURL(file);

			if(source != 'file_input'){
				var datatransfer = new DataTransfer();
				datatransfer.items.add(file);
				internal.file_input.files = datatransfer.files;
			}

			internal.preview.src = internal.file_url;
			internal.container.dataset.pointphotoState = 'image';

			internal.clear_button.disabled = false;
			internal.clear_button.style.display = '';
			var event = new Event('pointphoto-image-added');
		} else {
			internal.file_url = undefined;

			internal.preview.src = internal.default_preview_url;
			internal.container.dataset.pointphotoState = internal.default_state;

			internal.clear_button.disabled = true;
			internal.clear_button.style.display = 'none';
			event = new Event('pointphoto-image-removed');
		}
		delete internal.container.dataset.pointphotoWarning;
		internal.container.dispatchEvent(event);
	}

	this.use_camera = function(camera){
		if(!(camera instanceof PointPhotoCamera)){
			camera = internal.default_camera || PointPhoto.camera();
		}
		if(camera){
			camera.open(overlay_src,input_name,file => set_file_object(file, 'camera'))
		}
	}

	this.use_local = ()=>internal.file_input.click();

	this.clear = ()=>set_file_object();

	this.warn_required = function(force_warning){
		if(
			force_warning
			|| (
				typeof internal.container.dataset.pointphotoRequired != 'undefined'
				&& internal.container.dataset.pointphotoState != 'image'
			)
		){
			internal.container.dataset.pointphotoWarning = 'required';
			return true;
		} else {
			return false;
		}
	}

	this.remove_warning = function(){
		delete internal.container.dataset.pointphotoWarning;
	}
}

var PointPhoto = (function(){
	var active_camera = undefined;
	var active_album = [];

	function init(options){
		options = options || {};

		if(typeof options.camera == 'undefined'){
			options.camera = '.pointphoto-camera';
		}
		if(options.camera instanceof PointPhotoCamera){
			active_camera = PointPhotoCamera;
		} else if(options.camera instanceof Element){
			var camera_container = options.camera;
		} else {
			camera_container = document.querySelector(options.camera);
		}
		if(camera_container){
			active_camera = camera_container.PointPhotoCameraInstance || new PointPhotoCamera(camera_container);
		}

		if(typeof options.album == 'undefined'){
			options.album = '.pointphoto-image';
		}
		if(typeof options.album == 'string'){
			var album_images = document.querySelectorAll(options.album);
		} else if(typeof options.album == 'object' && typeof options.album.forEach == 'function'){
			album_images = options.album;
		}
		if(album_images){
			album_images.forEach(image => {
				if(!image.PointPhotoImageInstance){
					var instance = new PointPhotoImage(image, {camera: active_camera});
					image.PointPhotoImageInstance = instance;
					active_album.push(instance);
				}
			})
		}
	}

	function create_button(name, onclick, type, disabled){
		var button = document.createElement('button');
		button.classList.add(type == 'danger' ? 'pointphoto-button-danger' : 'pointphoto-button');
		button.setAttribute('type','button');
		button.addEventListener('click',onclick);
		button.append(PointPhoto.create_icon(name));
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

	function create_warning(){
		var div = document.createElement('div');
		div.classList.add('pointphoto-warning');
		div.replaceChildren(PointPhoto.create_icon('warning'));
		return div;
	}

	return {
		init: init,
		camera: () => active_camera,
		album: () => active_album,
		create_button: create_button,
		create_icon: create_icon,
		create_warning: create_warning
	}
})()
