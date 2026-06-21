<?php

return [
    // Base URL of the Node + Playwright scraper microservice.
    'url' => env('SCRAPER_URL', 'http://scraper:3000'),

    // Optional single proxy passed through to Playwright (e.g. residential
    // proxy to avoid datacenter-IP captchas). Format: http://user:pass@host:port
    'proxy' => env('SCRAPER_PROXY'),

    // HTTP request timeout (seconds). Scrolling ~600 reviews can take a while.
    'timeout' => (int) env('SCRAPER_TIMEOUT', 240),
];
