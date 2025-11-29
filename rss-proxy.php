<?php
// Simple RSS proxy to bypass CORS restrictions
header('Content-Type: application/xml; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$rss_url = 'https://www.forbidden-yoga.com/feed';

// Fetch the RSS feed
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $rss_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$rss_content = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($http_code == 200 && $rss_content) {
    echo $rss_content;
} else {
    http_response_code(500);
    echo '<?xml version="1.0"?><error>Unable to fetch RSS feed</error>';
}
?>
