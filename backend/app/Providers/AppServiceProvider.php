<?php

namespace App\Providers;

use App\Services\Yandex\ScraperClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ScraperClient::class, function ($app) {
            $config = $app['config']->get('scraper');

            return new ScraperClient(
                baseUrl: $config['url'],
                proxy: $config['proxy'] ?: null,
                timeout: $config['timeout'],
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
