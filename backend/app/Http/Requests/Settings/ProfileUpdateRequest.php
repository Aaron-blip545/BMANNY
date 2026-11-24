<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user('web')?->user_id;

        return [
            'full_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:150',
                Rule::unique(User::class, 'email')->ignore($userId, 'user_id'),
            ],
            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique(User::class, 'phone_number')->ignore($userId, 'user_id'),
            ],
        ];
    }
}
