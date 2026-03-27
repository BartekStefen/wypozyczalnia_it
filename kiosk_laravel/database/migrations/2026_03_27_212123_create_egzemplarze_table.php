<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
    Schema::createIfNotExists('egzemplarze', function (Blueprint $table) {
        $table->integer('id_egzemplarza')->autoIncrement();
        $table->integer('id_modelu')->nullable();
        $table->string('numer_seryjny', 100)->unique();
        $table->string('status', 30)->default('Dostępny');
        $table->decimal('cena_wypozyczenia_dzien', 10, 2);
        $table->primary('id_egzemplarza');
        $table->foreign('id_modelu')->references('id_modelu')->on('modele_sprzetu');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('egzemplarze');
    }
};
