<?php
/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/TRP-Solutions/boot-some/blob/master/LICENSE
*/
declare(strict_types=1);
require_once "../../heal-document/lib/HealDocument.php";
require_once "../lib/PointPhoto.php";

HealDocument::register_plugin('\TRP\PointPhoto\PointPhoto');

$doc = new HealDocument('html');
$html = $doc->el('html',['lang'=>'en']);
$head = $html->el('head');
$head->el('meta',['charset'=>'utf-8']);
$head->el('title')->te('PointPhoto sample');
$head->el('link',['rel'=>'stylesheet','href'=>'../lib/PointPhoto.css']);
$head->el('script',['src'=>'../lib/PointPhoto.js']);
$head->el('script',['src'=>'/wild-file/lib/WildFile.js']);
$body = $html->el('body');

$body->camera();

image($body, 'image1');

image($body, 'image2');

image($body, 'image3');

echo $doc;

function image($body, $name){
	$image = $body->image($name);
	$image->img($image);
	$buttons = $image->el('div',['class'=>'pointphoto-buttons']);
	$image->camera_button($buttons->el('button')->te('Camera'));
	$image->upload_button($buttons->el('button')->te('Upload'));
	$image->clear_button($buttons->el('button')->te('Clear'));
	$image->warning($image->el('div')->te('Required Image!'));
}
