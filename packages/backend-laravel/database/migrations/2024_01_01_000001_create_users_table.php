<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('userId')->primary();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('email')->unique();
            $table->string('passwordHash');
            $table->unsignedBigInteger('barangayId');
            $table->integer('pointsBalance')->default(0);
            $table->integer('totalSubmissions')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
