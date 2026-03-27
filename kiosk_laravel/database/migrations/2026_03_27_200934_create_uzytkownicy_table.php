<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up(): void
    {
        Schema::create('uzytkownicy', function (Blueprint $table) {
            $table->id();
            $table->string('imie');
            $table->string('email')->unique();
            $table->string('haslo');
            $table->string('rola')->default('klient');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uzytkownicy');
    }
};
