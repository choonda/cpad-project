<?php
$host = "localhost";
$username = "cpad";
$password = "cpadPassword";
$database = "cpad_sectno_groupname";

try { // Try to create connection
  $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
  //echo "<p>Successful connecting to <b>$database</b> database</p>";
  
} catch(PDOException $ex) { // Catch, stop and print connection error
  die("Connection failed: " . $ex->getMessage());
}
?>
