<?php
$root = __DIR__ . '/php';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = (is_string($uri) && $uri !== '') ? $uri : '/';
$path = '/' . ltrim(rawurldecode($uri), '/');
$candidate = $root . $path;
if ($path !== '/' && is_file($candidate)) {
    if (substr($candidate, -4) === '.php') {
        chdir($root);
        $_SERVER['SCRIPT_NAME'] = $path;
        require $candidate;
        return true;
    }
    return false;
}
chdir($root);
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PATH_INFO'] = $path;
require $root . '/index.php';
return true;
