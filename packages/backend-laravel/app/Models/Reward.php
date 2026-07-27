<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $primaryKey = 'rewardId';

    protected $fillable = [
        'rewardName',
        'description',
        'pointsCost',
        'stockQuantity',
        'category',
        'icon',
        'seasonal'
    ];
}
