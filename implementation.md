# Project Implementation Plan & Architecture Specifications

## 1. System Requirements

### 1.1 Development Environment & Software Stack
* **Operating System**: Windows 10 / 11 (AMD64).
* **Web Server Engine**: Apache 2.4.x (via XAMPP / Laragon development environments).
* **Server-Side Scripting Runtime**: PHP 8.2.x or higher.
* **Dependency & Package Manager**: PHP Composer (for Slim Framework skeleton and PSR dependencies management).
* **Database Management System**: MariaDB 10.19 / MySQL 8.x.
* **Database Client Credentials**: 
    * **Username**: `cpad`
    * **Password**: `cpadPassword`
    * **Database Name**: `cpad_03_DNF`

### 1.2 Architectural Pattern
* **3-Tier Decoupled Architecture**: Separation of presentation, application processing, and data management.
    * **Presentation Tier (Client Side)**: Native HTML5, CSS3 Grid/Flexbox layouts, and Vue.js 3 (via CDN global build) executing asynchronous AJAX Fetch routines.
    * **Application Tier (Server Side)**: PHP Slim Framework processing requests and executing object-oriented relational mapping using PDO.
    * **Data Tier (Storage)**: Normalized Relational Database Scheme (`cpad_03_DNF`) enforcing structural data integrity.

### 1.3 Security Standards
* **SQL Injection Immunity**: Disabling emulation options (`PDO::ATTR_EMULATE_PREPARES => false`) to enforce server-side parameterized prepared statements across all database queries.
* **XSS Mitigation**: Applying strict contextual sanitization via `htmlspecialchars()` or text-content bindings in Vue templates to prevent unauthorized script injections.
* **State Control**: Secure cookie-based state maintenance specifying expiration limits and constrained path parameters.
---

## 2. Detailed Design

### 2.1 Database Schema Reference
The application drives business workflows directly from five interconnected database tables:
1. **`users`**: Unique accounts containing credentials (`username`, `password`, `email`) mapped to specific domain permissions (`admin`, `vendor`, `customer`).
2. **`stalls`**: Physical food kiosks situated within the Arked Meranti campus cafeteria, assigned directly to a `vendor_id`.
3. **`menus`**: Food and beverage stock catalogs mapped to specific stalls, tracking item base costs and active availability states (`is_available`).
4. **`orders`**: Transaction entries linking customers to overall lifecycle tracking statuses (`Received`, `Preparing`, `Ready`) and calculated billing aggregates.
5. **`order_items`**: A highly normalized junction table resolving the many-to-many relationship between orders and menus, storing precise quantities and financial subtotals.
---

## 3. Pages Needed (Website View Baseline)

To satisfy the system scope for the primary Website View, four distinct front-end application files are deployed alongside back-end config utilities:

### 3.1 Structural System Configuration Files
* `public/libs/db_connect_PDO_SLIM.php`: Secure database resource provisioning file using robust PDO parameters.
* `public/index.php`: The main operational back-end gateway hosting Slim API application endpoint handlers.
* `public/css/style.css`: Centralized external cascading style sheet housing responsive UI rules and grid layouts.

### 3.2 Front-End Desktop Layout Views
1. **`public/login.html`**: Entry access view incorporating a secure authentication form.
2. **`public/customer_dashboard.html`**: Primary marketplace view hosting vendor categorization filters, interactive menu option card arrays, and a real-time shopping cart component.
3. **`public/customer_orders.html`**: Financial auditing and historical tracking dashboard for customers to trace processing states.
4. **`public/vendor_dashboard.html`**: Kiosk back-office operations center hosting incoming order queues and menu inventory toggles.
5. **`public/admin_dashboard.html`**: Master administrator control panel for global system oversight.
---

## 4. Detailed User Flow For Each Page

### 4.1 Login View (`login.html`)
* **Initial Entry**: The browser initiates an unauthenticated request to the login endpoint. Vue initializes the username and password models to an empty state.
* **User Action**: The operator inputs credentials into the interactive form field controls and clicks the "Login" action button.
* **System Processing**: 
    1. The Vue controller intercepts the form submission event, preventing standard browser page reloads.
    2. An asynchronous `POST` fetch routine transfers the credential payload to the back-end `/api/login` endpoint as a JSON string.
    3. The back-end Slim route intercepts the payload, executes a secure parameterized database query to match records in the `users` table, and returns a JSON verification packet.
* **Termination / Routing**: If validation fails, an error message renders dynamically on screen without reloading the page. Upon successful validation, authorization tokens are written into browser session storage cookies, and the application programmatically re-routes the user based on their specific role (`customer` or `vendor`).

### 4.2 Customer Ordering View (`customer_dashboard.html`)
* **Initial Entry**: The browser accesses the main marketplace view. The Vue lifecycle hook (`mounted()`) fires immediately, triggering parallel `GET` fetch calls to `/api/stalls` and `/api/menus`.
* **User Action - Filtering & Selection**:
    * The user clicks on specific stall categories. Vue dynamically filters the on-screen card collection array using conditional rendering directives.
    * The user clicks the "Add to Cart" button on desired food or beverage items.
* **System Processing - Cart State**:
    * Vue increments or adds the item object into a localized tracking array.
    * Computed properties instantly calculate individual item subtotals and aggregate the final cart total on the checkout panel.
* **User Action - Checkout**: The customer reviews the order summary and clicks the "Place Order" confirmation control.
* **System Processing - Order Creation**:
    * A `POST` fetch routine dispatches the composite checkout payload to `/orders/create`.
    * The Slim application locks down a transaction block, commits the root record to the `orders` table, extracts the sequential database primary key identifier, maps individual items, writes to `order_items`, and commits the transaction.
* **Termination**: The local cart array resets completely, and the user is redirected to the tracking interface.

### 4.3 Customer Order Tracking View (`customer_orders.html`)
* **Initial Entry**: The page opens, and Vue reads the authenticated `user_id` from the active cookie record. It sends a `GET` request to `/api/orders?customer_id=x`.
* **System Processing**: The database evaluates historical order rows for that specific customer ID and responds with a JSON array. Vue renders these records chronologically inside a responsive list layout.
* **User Action - Real-time Observation**: The customer stays on the screen watching active processing pipelines.
* **System Processing - Polling Loop**: A background interval function executes a `GET` fetch query every 5 seconds to request status state definitions. As order fulfillment fields mutate on the database layer from `Received` to `Preparing` and finally `Ready`, Vue dynamically updates structural contextual badges on the front-end view instantly.

### 4.4 Vendor Management Back-Office View (`vendor_dashboard.html`)
* **Initial Entry**: The kitchen interface initializes, and Vue issues a `GET` request to `/api/orders` to fetch all current pending transactions. Concurrently, it pulls `/api/menus` for inventory tracking.
* **User Action - Order Progression**: The cook views an incoming ticket card and clicks the progress state control button (e.g., changing status from `Received` to `Preparing`).
* **System Processing - State Transition**:
    * Vue executes an asynchronous `PUT` update operation to `/api/orders/{id}/status` passing the next lifecycle state value.
    * The backend database execution modifies the state property in the specific order row. The active kitchen screen automatically updates to reflect the change.
* **User Action - Stock Availability Toggle**: An ingredient runs out in the kitchen. The vendor toggles the checkbox next to the menu item.
* **System Processing - Stock Out**:
    * Vue fires a `PUT` request to `/api/menus/{id}/toggle`, updating the `is_available` boolean property to `0`.
    * The database record updates immediately. This menu item is hidden instantly on the customer-facing view, preventing new orders for out-of-stock items.