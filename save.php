<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$saveFile = __DIR__ . "/savedata.json";

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "POST") {
    $body = file_get_contents("php://input");
    $data = json_decode($body, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Ogiltig data"]);
        exit;
    }

    $data["savedAt"] = date("Y-m-d H:i:s");

    file_put_contents($saveFile, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true, "savedAt" => $data["savedAt"]]);

} elseif ($method === "GET") {
    if (file_exists($saveFile)) {
        $raw = file_get_contents($saveFile);
        echo $raw;
    } else {
        echo json_encode(["empty" => true]);
    }

} elseif ($method === "DELETE") {
    if (file_exists($saveFile)) {
        unlink($saveFile);
    }
    echo json_encode(["success" => true]);

} else {
    http_response_code(405);
    echo json_encode(["error" => "Metod ej tillåten"]);
}