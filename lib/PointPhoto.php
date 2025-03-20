<?php
/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/TRP-Solutions/boot-some/blob/master/LICENSE
*/
declare(strict_types=1);
namespace TRP\PointPhoto;

class PointPhoto extends \HealPlugin {
	public static function can_create($name): bool {
		return $name == 'camera' || $name == 'image';
	}

	public static function camera($parent, float $opacity = 1.0, $icon_builder = null) {
		$camera = $parent->el('div',[
			'class'=>'pointphoto-camera',
			'data-pointphoto'=>'container',
			'data-pointphoto-state'=>'inactive',
			'data-pointphoto-orientation'=>'landscape'
		]);
		$viewer = $camera->el('div',['class'=>'pointphoto-camera-viewer']);

		$loading = $viewer->el('div',['class'=>'pointphoto-camera-loading']);
		static::icon($icon_builder, $loading, 'loading');
		$viewer->el('video',['autoplay','muted','playsinline']);
		$viewer->el('canvas',['class'=>'pointphoto-hidden']);
		if($opacity < 1){
			$opacity = max(0, $opacity);
			$opacity = number_format($opacity,2,'.','');
			$viewer->el('img',['style'=>"opacity:$opacity;"]);
		} else {
			$viewer->el('img');
		}

		$controls = $camera->el('div',['class'=>'pointphoto-camera-controls']);
		static::button($icon_builder, $controls, 'take_picture', 'PointPhoto.snapshot(this);');
		static::button($icon_builder, $controls, 'swap_camera', 'PointPhoto.swap_camera();');
		static::button($icon_builder, $controls, 'cancel', 'PointPhoto.close(this);', 'pointphoto-button-danger');
		return $camera;
	}

	public static function image($parent, $name, $src = null, $overlay = null, $required = false, $onchange = null){
		return new self($parent, $name, $src, $overlay, $required, $onchange);
	}

	protected static function button($icon_builder, $parent, $symbol, $onclick, $class = 'pointphoto-button'){
		$button = $parent->el('button',['class'=>$class,'onclick'=>$onclick,'type'=>'button']);
		static::icon($icon_builder, $button, $symbol);
		return $button;
	}

	protected static function icon($icon_builder, $parent, $symbol){
		if(is_callable($icon_builder)){
			$icon_builder($parent, $symbol);
		} else {
			$parent->el('span')->te($symbol);
		}
	}

	public function __construct(
		\HealComponent $parent,
		protected string $name,
		protected ?string $src = null,
		protected ?string $overlay = null,
		protected bool $required = false
	){
		$this->primary_element = $parent->el('div',[
			'class'=> 'pointphoto-image',
			'data-pointphoto'=> 'container',
			'data-pointphoto-name'=> $name,
			'data-pointphoto-overlay'=> $overlay,
			'data-pointphoto-preset'=> $src,
			'data-pointphoto-state'=> $src ? 'image' : 'empty',
			'data-pointphoto-source'=> $src ? 'preset' : null,
			'data-pointphoto-required'=> $required ? 'required' : null
		]);
		$this->primary_element->el('input',['type'=>'file','data-pointphoto'=>'upload','class'=>'pointphoto-hidden']);
	}

	public function img($parent){
		return $parent->el('img', [
			'class'=>'pointphoto-image-preview',
			'src'=>$this->src ?? $this->overlay ?? ''
		]);
	}

	public function camera_button($button, $class = ''){
		$button->at(['onclick'=>'PointPhoto.open(this);']);
		$button->at(['class'=>'pointphoto-button '.$class], true);
	}

	public function upload_button($button, $class = ''){
		$button->at(['onclick'=>'PointPhoto.local_file(this);']);
		$button->at(['class'=>'pointphoto-button '.$class], true);
	}

	public function clear_button($button, $class = ''){
		$button->at([
			'onclick'=>'PointPhoto.clear(this);',
			'data-pointphoto'=>'clear-button',
			'disabled'
		]);
		$button->at(['class'=>'pointphoto-button-danger '.$class], true);
	}

	public function warning($warning){
		$warning->at(['data-pointphoto'=>'require-warning']);
		$warning->at(['class'=>'pointphoto-warning'], true);
	}
}
