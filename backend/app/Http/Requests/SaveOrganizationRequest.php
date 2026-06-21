<?php

namespace App\Http\Requests;

use App\Services\Yandex\YandexUrlParser;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class SaveOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'url' => [
                'required',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! app(YandexUrlParser::class)->isValid((string) $value)) {
                        $fail('Укажите корректную ссылку на карточку организации в Яндекс.Картах.');
                    }
                },
            ],
        ];
    }
}
