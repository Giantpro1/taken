<?php
/**
 * api/metrics.php
 * Fetches TAKEN's public follower count from X profile page.
 * No API key needed. Caches for 30 minutes.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$username   = 'T_A_K_E_N_1';
$cache_file = __DIR__ . '/cache_metrics.json';
$cache_ttl  = 30 * 60; // 30 minutes

// ── Serve from cache if still fresh ──────────────────────────
if (file_exists($cache_file)) {
    $age = time() - filemtime($cache_file);
    if ($age < $cache_ttl) {
        echo file_get_contents($cache_file);
        exit;
    }
}

// ── Fetch public profile page ────────────────────────────────
$url = "https://twitter.com/{$username}";

$context = stream_context_create([
    'http' => [
        'method'  => 'GET',
        'timeout' => 10,
        'header'  => implode("\r\n", [
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language: en-US,en;q=0.9',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ]),
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
    ],
]);

$html = @file_get_contents($url, false, $context);

$followers  = null;
$tweet_count = null;

if ($html) {
    // Method 1: JSON-LD structured data (most reliable)
    if (preg_match('/<script type="application\/ld\+json">(.*?)<\/script>/s', $html, $m)) {
        $ld = json_decode($m[1], true);
        if (!empty($ld['interactionStatistic'])) {
            foreach ($ld['interactionStatistic'] as $stat) {
                if (isset($stat['name']) && stripos($stat['name'], 'follow') !== false) {
                    $followers = (int) $stat['userInteractionCount'];
                }
            }
        }
    }

    // Method 2: meta description "X Followers"
    if (!$followers && preg_match('/([\d,]+)\s+Followers/i', $html, $m)) {
        $followers = (int) str_replace(',', '', $m[1]);
    }

    // Tweet count from meta
    if (preg_match('/([\d,]+)\s+(?:Posts|Tweets)/i', $html, $m)) {
        $tweet_count = (int) str_replace(',', '', $m[1]);
    }
}

$result = [
    'username'   => $username,
    'followers'  => $followers  ?? 0,
    'tweets'     => $tweet_count ?? 0,
    'fetched_at' => date('c'),
    'source'     => $followers ? 'live' : 'unavailable',
];

// ── Write cache ───────────────────────────────────────────────
file_put_contents($cache_file, json_encode($result));

echo json_encode($result);