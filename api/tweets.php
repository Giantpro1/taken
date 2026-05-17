<?php
/**
 * api/tweets.php
 * Uses X's FREE public oEmbed endpoint — zero API key needed.
 * You only need to paste TAKEN's real tweet URLs below.
 * Caches rendered HTML for 1 hour.
 *
 * HOW TO GET TWEET URLs:
 * 1. Go to https://x.com/T_A_K_E_N_1
 * 2. Click on any tweet to open it
 * 3. Copy the URL from your browser address bar
 *    e.g. https://twitter.com/T_A_K_E_N_1/status/1234567890123456789
 * 4. Paste it into the $tweet_urls array below
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── PASTE TAKEN'S REAL TWEET URLS HERE ───────────────────────
$tweet_urls = [
    'https://x.com/T_A_K_E_N_1/status/2054839508319744261',
     'https://x.com/T_A_K_E_N_1/status/2046640616541409634',
     'https://x.com/T_A_K_E_N_1/status/2046518464542605690',
     'https://x.com/T_A_K_E_N_1/status/2046282043877982652',
];
// ─────────────────────────────────────────────────────────────

$cache_file = __DIR__ . '/cache_tweets.json';
$cache_ttl  = 60 * 60; // 1 hour

// ── Serve from cache if fresh ─────────────────────────────────
if (file_exists($cache_file)) {
    $age = time() - filemtime($cache_file);
    if ($age < $cache_ttl) {
        echo file_get_contents($cache_file);
        exit;
    }
}

// ── Fetch oEmbed for each tweet URL ──────────────────────────
// X's oEmbed endpoint is completely free, no auth required.
// Docs: https://developer.twitter.com/en/docs/twitter-for-websites/oembed-api

$results = [];

foreach ($tweet_urls as $url) {
    // Skip placeholder URLs
    if (strpos($url, 'REPLACE_WITH') !== false) continue;

    $oembed_url = 'https://publish.twitter.com/oembed?'
        . http_build_query([
            'url'          => $url,
            'theme'        => 'dark',
            'dnt'          => 'true',
            'omit_script'  => 'true', // we load widgets.js once globally
            'hide_thread'  => 'true',
            'align'        => 'none',
        ]);

    $context = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => 8,
            'header'  => 'User-Agent: Mozilla/5.0 (compatible; portfolio-bot/1.0)',
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);

    $response = @file_get_contents($oembed_url, false, $context);

    if ($response) {
        $data = json_decode($response, true);
        if ($data && !empty($data['html'])) {
            $results[] = [
                'html'        => $data['html'],
                'author_name' => $data['author_name'] ?? 'TAKEN',
                'author_url'  => $data['author_url']  ?? 'https://x.com/T_A_K_E_N_1',
                'url'         => $url,
            ];
        }
    }
}

// ── Write cache ───────────────────────────────────────────────
file_put_contents($cache_file, json_encode($results));

echo json_encode($results);