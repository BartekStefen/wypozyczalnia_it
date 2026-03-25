<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::create('wynajmy', function (Blueprint $table) {
        $table->id();
        $table->integer('id_egzemplarza'); // ID sprzętu który pożyczamy
        $table->date('data_start');
        $table->date('data_koniec');
        $table->decimal('cena_calkowita', 10, 2);
        $table->string('status')->default('Zarezerwowany');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wynajmy');
    }
};
