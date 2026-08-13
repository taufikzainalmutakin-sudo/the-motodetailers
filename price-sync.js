(() => {
  const SUPABASE_URL = 'https://nbsmkxarkpesjiftmbwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
  const { createClient } = window.supabase || {};

  if (!createClient) {
    console.error('Supabase client tidak tersedia.');
    return;
  }

  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  const SERVICE_MAP = {
    'Premium Wash': 'premium',
    'Glossin Aja': 'glossAja',
    'Glossin Pro': 'glossPro',
    'Detailin Pro': 'detailin',
    'NanoShine': 'nano',
    'Cuci Rangka Pro': 'frame',
    'NanoShine Express': 'nanoExpress',
    'Detailing Doff': 'doff'
  };

  const SERVICE_SLUG_MAP = {
    premium: 'Premium Wash',
    glossAja: 'Glossin Aja',
    glossPro: 'Glossin Pro',
    detailin: 'Detailin Pro',
    nano: 'NanoShine',
    frame: 'Cuci Rangka Pro',
    nanoExpress: 'NanoShine Express',
    doff: 'Detailing Doff'
  };

  const SIZE_MAP = {
    'Small': 'small',
    'Medium': 'medium',
    'Large': 'large',
    'X-tra Large': 'xlarge',
    'Xtra Large': 'xlarge',
    'Super Large': 'super'
  };

  const SIZE_NAMES = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'Xtra Large',
    super: 'Super Large'
  };

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const rupiah = value => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

  let refreshTimer = null;
  let refreshing = false;

  async function fetchPublicData() {
    const [servicesRes, sizesRes, motorsRes, pricesRes, settingsRes] = await Promise.all([
      db.from('services').select('id,name,slug,description,result_url,image_url,active,sort_order').eq('active', true).order('sort_order'),
      db.from('motor_sizes').select('id,name,active,sort_order').eq('active', true).order('sort_order'),
      db.from('motor_catalog').select('id,brand,model,motor_size_id,year_start,year_end,notes,active,sort_order').eq('active', true).order('sort_order'),
      db.from('service_prices').select('id,service_id,motor_size_id,price,active,services(name),motor_sizes(name)').eq('active', true),
      db.from('site_settings').select('setting_key,setting_value')
    ]);

    for (const result of [servicesRes, sizesRes, motorsRes, pricesRes, settingsRes]) {
      if (result.error) throw result.error;
    }

    return {
      services: servicesRes.data || [],
      sizes: sizesRes.data || [],
      motors: motorsRes.data || [],
      prices: pricesRes.data || [],
      settings: settingsRes.data || []
    };
  }

  function applyPrices(rows) {
    const next = {
      small: {},
      medium: {},
      large: {},
      xlarge: {},
      super: {}
    };

    rows.forEach(row => {
      const size = SIZE_MAP[row.motor_sizes?.name];
      const service = SERVICE_MAP[row.services?.name];
      if (!size || !service || row.price == null) return;
      next[size][service] = Number(row.price);
    });

    if (window.prices && typeof window.prices === 'object') {
      Object.keys(next).forEach(size => {
        window.prices[size] = {
          ...window.prices[size],
          ...next[size]
        };
      });
    }

    const active = document.querySelector('.size-btn.active');
    const activeSize = active?.dataset?.size || 'small';
    if (typeof window.showPrice === 'function') window.showPrice(activeSize);
  }

  function applyServices(rows) {
    const container = document.querySelector('.services');
    if (!container) return;

    container.innerHTML = rows.map(service => {
      const content = `
        <h3>${esc(service.name)}</h3>
        <p>${esc(service.description || '')}</p>
      `;

      if (service.result_url) {
        return `<a class="service service-link" href="${esc(service.result_url)}" target="_blank" rel="noopener noreferrer">${content}</a>`;
      }

      return `<div class="service">${content}</div>`;
    }).join('');
  }

  function applyMotors(rows, sizes) {
    const sizeById = new Map(sizes.map(size => [size.id, SIZE_MAP[size.name]]));
    const nextRows = rows
      .map(motor => ({
        brand: motor.brand,
        model: motor.model,
        size: sizeById.get(motor.motor_size_id),
        yearStart: motor.year_start,
        yearEnd: motor.year_end,
        notes: motor.notes
      }))
      .filter(motor => motor.size);

    if (Array.isArray(window.catalogRows)) {
      window.catalogRows.splice(0, window.catalogRows.length, ...nextRows);
    }

    const search = document.getElementById('search');
    if (search && search.value.trim().length >= 2) {
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function settingMap(rows) {
    return Object.fromEntries(rows.map(row => [row.setting_key, row.setting_value || {}]));
  }

  function applySettings(rows) {
    const settings = settingMap(rows);
    const whatsapp = settings.whatsapp?.number;
    const instagram = settings.instagram?.url;
    const tiktok = settings.tiktok?.url;
    const maps = settings.google_maps?.url;

    const whatsappLink = document.querySelector('.social-card.whatsapp');
    const instagramLink = document.querySelector('.social-card.instagram');
    const tiktokLink = document.querySelector('.social-card.tiktok');
    const mapsLink = document.querySelector('.social-card.maps');

    if (whatsapp && whatsappLink) {
      const clean = String(whatsapp).replace(/\D/g, '');
      const booking = settings.booking_message?.template || '';
      whatsappLink.href = `https://wa.me/${clean}?text=${encodeURIComponent(booking)}`;
    }
    if (instagram && instagramLink) instagramLink.href = instagram;
    if (tiktok && tiktokLink) tiktokLink.href = tiktok;
    if (maps && mapsLink) mapsLink.href = maps;

    const bookingButton = document.querySelector('.booking-button');
    if (bookingButton && whatsapp) {
      const clean = String(whatsapp).replace(/\D/g, '');
      const booking = settings.booking_message?.template || '';
      bookingButton.href = `https://wa.me/${clean}?text=${encodeURIComponent(booking)}`;
    }
  }

  async function syncCustomer() {
    if (refreshing) return;
    refreshing = true;

    try {
      const data = await fetchPublicData();
      applyPrices(data.prices);
      applyServices(data.services);
      applyMotors(data.motors, data.sizes);
      applySettings(data.settings);
      console.log('[THE MOTODETAILERS] Customer data synced in real-time.');
    } catch (error) {
      console.error('[THE MOTODETAILERS] Real-time sync failed:', error);
    } finally {
      refreshing = false;
    }
  }

  function scheduleSync() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(syncCustomer, 120);
  }

  // Initial authoritative load from Supabase.
  syncCustomer();

  // Live database changes. No Cloudflare redeploy or page refresh is needed.
  const channel = db
    .channel('the-motodetailers-customer-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_prices' }, scheduleSync)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, scheduleSync)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'motor_catalog' }, scheduleSync)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'motor_sizes' }, scheduleSync)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, scheduleSync)
    .subscribe(status => {
      console.log('[THE MOTODETAILERS] Realtime status:', status);
    });

  window.addEventListener('beforeunload', () => {
    db.removeChannel(channel);
  });
})();
