<?php
// Assignment 2, SCSM2223-25262 (index.php)
// Group Name: ???

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Explicitly set the base path to match your Apache Alias exactly
$app->setBasePath('/cpad-project/DNF-3');

// Add routing middleware
$app->addRoutingMiddleware();

// Add error middleware LAST
$app->addErrorMiddleware(true, true, true); 

$app->get('/', function (Request $request, Response $response, $args) {
    $response->getBody()->write("<h3>CPAD - Project REST Service</h3>");
    return $response;
});

$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

$app->run();
