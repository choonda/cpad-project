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

// ==========================================
// 1. User Authentication & Login API (POST Method)
// ==========================================
$app->post('/api/login', function (Request $request, Response $response) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php'; // Load the secure PDO database connection object $pdo
    
    // Parse the JSON string from the HTTP request body into a standard PHP associative array
    $data = json_decode($request->getBody()->getContents(), true);
    $payload = ['success' => false, 'role' => null, 'user_id' => null, 'username' => null, 'error' => null];
    
    if (empty($data['username']) || empty($data['password'])) {
        $payload['error'] = 'Please enter both username and password.';
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
    
    try {
        // Security Criterion: Use PDO named parameters to prevent SQL injection attacks
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username AND password = :password");
        $stmt->execute([
            ':username' => $data['username'],
            ':password' => $data['password']
        ]);
        $user = $stmt->fetch();
        
        if ($user) {
            $payload['success'] = true;
            $payload['role'] = $user['role'];
            $payload['user_id'] = $user['user_id'];
            $payload['username'] = $user['username'];
            
            // Send cookies to the browser to maintain the user login session state
            setcookie('username', $user['username'], time() + 3600, '/');
            setcookie('role', $user['role'], time() + 3600, '/');
            setcookie('user_id', $user['user_id'], time() + 3600, '/');
        } else {
            $payload['error'] = 'Invalid username or password.';
        }
    } catch (PDOException $ex) {
        $payload['error'] = 'Database error: ' . $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 2. Fetch Stalls List API (GET Method)
// ==========================================
$app->get('/api/stalls', function (Request $request, Response $response) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $payload = ['success' => true, 'data' => []];
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM stalls ORDER BY stall_id ASC");
        $stmt->execute();
        $payload['data'] = $stmt->fetchAll();
    } catch (PDOException $ex) {
        $payload['success'] = false;
        $payload['error'] = $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 3. Dynamic Menu Items Retrieval API (GET Method)
// ==========================================
$app->get('/api/menus', function (Request $request, Response $response) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $payload = ['success' => true, 'data' => []];
    
    // Retrieve URL query parameters to support filtering by specific vendor stalls
    $queryParams = $request->getQueryParams();
    $stall_id = isset($queryParams['stall_id']) ? $queryParams['stall_id'] : null;
    
    try {
        if ($stall_id) {
            // If stall_id is provided, fetch menu items belonging only to that specific stall
            $stmt = $pdo->prepare("SELECT * FROM menus WHERE stall_id = :stall_id ORDER BY category ASC, item_name ASC");
            $stmt->execute([':stall_id' => $stall_id]);
        } else {
            // Default: Fetch all available menu offerings inside the food court ecosystem
            $stmt = $pdo->prepare("SELECT * FROM menus ORDER BY item_name ASC");
            $stmt->execute();
        }
        $payload['data'] = $stmt->fetchAll();
    } catch (PDOException $ex) {
        $payload['success'] = false;
        $payload['error'] = $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 4. Consolidated Checkout & Order Creation API (POST Method)
// ==========================================
$app->post('/orders/create', function (Request $request, Response $response) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $data = json_decode($request->getBody()->getContents(), true);
    $payload = ['success' => false, 'order_id' => null, 'error' => null];
    
    if (empty($data['customer_id']) || empty($data['items']) || empty($data['total_price'])) {
        $payload['error'] = 'Incomplete order payload.';
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
    
    try {
        // Begin database transaction to ensure both master order and item details write successfully together
        $pdo->beginTransaction();
        
        // Step 4.1: Insert into the orders master table first, initializing the status to 'Received'
        $stmtOrder = $pdo->prepare("INSERT INTO orders (customer_id, total_price, status) VALUES (:customer_id, :total_price, 'Received')");
        $stmtOrder->execute([
            ':customer_id' => $data['customer_id'],
            ':total_price' => $data['total_price']
        ]);
        
        $order_id = $pdo->lastInsertId(); // Catch the auto-incremented primary key of the new order record
        
        // Step 4.2: Loop and batch insert the digital shopping cart items into the order_items junction table
        $stmtItem = $pdo->prepare("INSERT INTO order_items (item_id, order_id, menu_id, quantity, subtotal) VALUES (:item_id, :order_id, :menu_id, :quantity, :subtotal)");
        
        // Generate sequential item identifier
        $stmtCount = $pdo->query("SELECT IFNULL(MAX(item_id), 0) FROM order_items");
        $itemIdCounter = $stmtCount->fetchColumn() + 1;
        
        foreach ($data['items'] as $item) {
            $stmtItem->execute([
                ':item_id'   => $itemIdCounter++,
                ':order_id'  => $order_id,
                ':menu_id'   => $item['menu_id'],
                ':quantity'  => $item['quantity'],
                ':subtotal'  => $item['price'] * $item['quantity']
            ]);
        }
        
        $pdo->commit(); // Commit database changes securely
        $payload['success'] = true;
        $payload['order_id'] = $order_id;
        
    } catch (PDOException $ex) {
        $pdo->rollBack(); // Roll back database mutations to preserve absolute data integrity if a failure happens
        $payload['error'] = 'Transaction failed: ' . $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 5. Customer/Vendor Order History & Tracking API (GET Method)
// ==========================================
$app->get('/api/orders', function (Request $request, Response $response) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $payload = ['success' => true, 'data' => []];
    
    $queryParams = $request->getQueryParams();
    $customer_id = isset($queryParams['customer_id']) ? $queryParams['customer_id'] : null;
    
    try {
        if ($customer_id) {
            // Customer side: query order history and real-time fulfillment status for a specific patron
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE customer_id = :customer_id ORDER BY order_date DESC");
            $stmt->execute([':customer_id' => $customer_id]);
        } else {
            // Vendor side: check all current incoming customer order ticket items across the food court
            $stmt = $pdo->prepare("SELECT o.*, u.username as customer_name FROM orders o JOIN users u ON o.customer_id = u.user_id ORDER BY o.order_date DESC");
            $stmt->execute();
        }
        $payload['data'] = $stmt->fetchAll();
    } catch (PDOException $ex) {
        $payload['success'] = false;
        $payload['error'] = $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 6. Vendor Order Status Lifecycle Management API (PUT Method)
// ==========================================
$app->put('/api/orders/{id}/status', function (Request $request, Response $response, $args) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $data = json_decode($request->getBody()->getContents(), true);
    $order_id = $args['id']; // Dynamically parse the variable placeholder {id} out of the URL endpoint path
    $payload = ['success' => false, 'error' => null];
    
    if (empty($data['status'])) {
        $payload['error'] = 'Status value is required.';
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
    
    try {
        // Securely progress the order lifecycle staging parameters (Received -> Preparing -> Ready)
        $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE order_id = :order_id");
        $stmt->execute([
            ':status'   => $data['status'],
            ':order_id' => $order_id
        ]);
        $payload['success'] = true;
    } catch (PDOException $ex) {
        $payload['error'] = $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// 7. Vendor Item Stock Availability Toggle API (PUT Method)
// ==========================================
$app->put('/api/menus/{id}/toggle', function (Request $request, Response $response, $args) {
    require __DIR__ . '/libs/db_connect_PDO_SLIM.php';
    $data = json_decode($request->getBody()->getContents(), true);
    $menu_id = $args['id'];
    $payload = ['success' => false, 'error' => null];
    
    if (!isset($data['is_available'])) {
        $payload['error'] = 'Availability toggle state missing.';
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
    
    try {
        // Availability Toggle: instantly alter menu stock visibility status to prevent order inaccuracies
        $stmt = $pdo->prepare("UPDATE menus SET is_available = :is_available WHERE menu_id = :menu_id");
        $stmt->execute([
            ':is_available' => $data['is_available'],
            ':menu_id'      => $menu_id
        ]);
        $payload['success'] = true;
    } catch (PDOException $ex) {
        $payload['error'] = $ex->getMessage();
    }
    
    $response->getBody()->write(json_encode($payload));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
