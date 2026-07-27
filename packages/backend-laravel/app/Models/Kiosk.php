<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kiosk extends Model
{
    protected $primaryKey = 'kioskId';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kioskId',
        'location',
        'status',
        'battery',
        'lastPing',
        'temp'
    ];
}
