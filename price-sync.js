(function () {
  const SUPABASE_URL = 'https://nbsmkxarkpesjiftmbwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

  const sizeKey = {
    'Small': 'small',
    'Medium': 'medium',
    'Large': 'large',
    'X-tra Large': 'xlarge',
    'Xtra Large': 'xlarge',
    'Super Large': 'super'
  };

  const serviceKey = {
    'Premium Wash': 'premium',
    'Glossin Aja': 'glossAja',
    'Glossin Pro': 'glossPro',
    'Detailin Pro': 'detailin',
    'NanoShine': 'nano',
    'Detailing Doff': 'doff',
    'NanoShine Express': 'nanoExpress',
    'Cuci Rangka Pro': 'frame'
  };

  async function syncPrices() {
    if (typeof prices === 'undefined' || typeof showPrice !== 'function') return;

    try {
      const url = SUPABASE_URL +
        '/rest/v1/service_prices?select=price,active,services(name),motor_sizes(name)&active=eq.true&_ts=' + Date.now();

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) throw new Error('Price API ' + response.status);

      const rows = await response.json();
      let changed = false;

      for (const row of rows) {
        const size = sizeKey[row.motor_sizes?.name];
        const service = serviceKey[row.services?.name];
        if (!size || !service || row.price == null) continue;

        const value = Number(row.price);
        if (!Number.isFinite(value)) continue;

        prices[size][service] = value;
        changed = true;
      }

      if (!changed) return;

      const active = document.querySelector('.size-btn.active');
      showPrice(active?.dataset?.size || 'small');

      const search = document.getElementById('search');
      if (search && search.value.trim().length >= 2) {
        search.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (error) {
      console.warn('Gagal mengambil harga terbaru dari Supabase:', error);
      // Harga bawaan tetap dipakai sebagai fallback agar website tidak rusak.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPrices, { once: true });
  } else {
    syncPrices();
  }
})();
