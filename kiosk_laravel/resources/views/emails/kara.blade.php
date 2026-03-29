<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Powiadomienie o karze — Kiosk IT</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 2rem; }
    .header h1 { color: #fff; font-size: 1.4rem; margin: 0; font-weight: 700; }
    .header p  { color: rgba(255,255,255,0.75); margin: 0.25rem 0 0; font-size: 0.875rem; }
    .body { padding: 2rem; }
    .alert { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
    .alert-title { color: #dc2626; font-weight: 700; font-size: 0.9rem; margin: 0 0 0.25rem; }
    .alert-amount { font-size: 1.75rem; font-weight: 800; color: #dc2626; }
    .row { display: flex; justify-content: space-between; padding: 0.65rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
    .row-label { color: #64748b; }
    .row-val   { font-weight: 600; color: #0f172a; }
    .note { background: #eff6ff; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; font-size: 0.82rem; color: #1d4ed8; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 1rem 2rem; text-align: center; font-size: 0.78rem; color: #94a3b8; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>⚡ Kiosk IT</h1>
    <p>Powiadomienie o naliczonej karze</p>
  </div>

  <div class="body">
    <p style="color:#374151;font-size:0.95rem;margin:0 0 1.5rem">
      Szanowny/a <strong>{{ $imie }}</strong>,
    </p>

    <div class="alert">
      <div class="alert-title">Naliczono karę finansową</div>
      <div class="alert-amount">{{ $kwota }} zł</div>
    </div>

    <div class="row">
      <span class="row-label">Rodzaj przewinienia</span>
      <span class="row-val">{{ $przewinienie }}</span>
    </div>
    <div class="row">
      <span class="row-label">Dotyczy sprzętu</span>
      <span class="row-val">{{ $sprzet }}</span>
    </div>
    <div class="row">
      <span class="row-label">Kwota kary</span>
      <span class="row-val">{{ $kwota }} zł</span>
    </div>

    @if($opis)
    <div class="row" style="border:none">
      <span class="row-label">Uwagi admina</span>
      <span class="row-val" style="max-width:60%;text-align:right">{{ $opis }}</span>
    </div>
    @endif

    <div class="note">
      Prosimy o uregulowanie należności podczas zwrotu sprzętu lub kontakt z obsługą.<br>
      W przypadku pytań odpiszemy na tę wiadomość.
    </div>
  </div>

  <div class="footer">
    © {{ date('Y') }} Kiosk IT — Wypożyczalnia sprzętu IT
  </div>
</div>
</body>
</html>