<?php

namespace Tests\Unit;

use App\Services\Yandex\YandexUrlParser;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class YandexUrlParserTest extends TestCase
{
    private YandexUrlParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new YandexUrlParser();
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function validUrls(): array
    {
        return [
            'ru with slug' => ['https://yandex.ru/maps/org/sushi_shop/1234567890', '1234567890'],
            'ru without slug' => ['https://yandex.ru/maps/org/1234567890', '1234567890'],
            'com tld' => ['https://yandex.com/maps/org/cafe/9876543210/reviews/', '9876543210'],
            'with city prefix' => ['https://yandex.ru/maps/213/moscow/org/cafe/555000111', '555000111'],
            'http scheme' => ['http://yandex.ru/maps/org/x/42', '42'],
        ];
    }

    #[DataProvider('validUrls')]
    public function test_it_extracts_id_from_valid_urls(string $url, string $expectedId): void
    {
        $this->assertTrue($this->parser->isValid($url));
        $this->assertSame($expectedId, $this->parser->extractId($url));
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function invalidUrls(): array
    {
        return [
            'empty' => [''],
            'not yandex' => ['https://google.com/maps/org/x/1'],
            'yandex but not org' => ['https://yandex.ru/maps/213/moscow/'],
            'plain text' => ['hello world'],
            'no id' => ['https://yandex.ru/maps/org/cafe/'],
        ];
    }

    #[DataProvider('invalidUrls')]
    public function test_it_rejects_invalid_urls(string $url): void
    {
        $this->assertFalse($this->parser->isValid($url));
        $this->assertNull($this->parser->extractId($url));
    }

    public function test_it_builds_reviews_url(): void
    {
        $this->assertSame(
            'https://yandex.ru/maps/org/1234567890/reviews/',
            $this->parser->reviewsUrl('https://yandex.ru/maps/org/sushi/1234567890'),
        );
    }
}
