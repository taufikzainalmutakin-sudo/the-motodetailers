(() => {
  const SUPABASE_URL = 'https://nbsmkxarkpesjiftmbwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

  const SERVICE_KEYS = {
    'Premium Wash': 'premium',
    'Glossin Aja': 'glossAja',
    'Glossin Pro': 'glossPro',
    'Detailin Pro': 'detailin',
    'NanoShine': 'nano',
    'Cuci Rangka Pro': 'frame',
    'NanoShine Express': 'nanoExpress',
    'Detailing Doff': 'doff'
  };

  const SIZE_KEYS = {
    'Small': 'small',
    'Medium': 'medium',
    'Large': 'large',
    'X-tra Large': 'xlarge',
    'Xtra Large': 'xlarge',
    'Super Large': 'super'
  };

  const SIZE_NAMES = {
    small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Xtra Large', super: 'Super Large'
  };

  const SERVICE_ORDER = [
    ['Premium Wash', 'premium'], ['Glossin Aja', 'glossAja'], ['Glossin Pro', 'glossPro'],
    ['Detailin Pro', 'detailin'], ['NanoShine', 'nano'], ['NanoShine Express', 'nanoExpress'],
    ['Detailing Doff', 'doff'], ['Cuci Rangka Pro', 'frame']
  ];

  const rupiah = value => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  let prices = { small: {}, medium: {}, large: {}, xlarge: {}, super: {} };
  let catalog = [];
  let settings = {};
  let timer = null;
  let syncing = false;
  let bookingDb = null;
  let bookingServices = [];
  let bookingSizes = [];
  let bookingPrices = [];

  function loadSupabase() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('Supabase JS gagal dimuat'));
      script.onerror = () => reject(new Error('Gagal memuat Supabase JS'));
      document.head.appendChild(script);
    });
  }

  function updatePrices(rows) {
    prices = { small: {}, medium: {}, large: {}, xlarge: {}, super: {} };
    rows.forEach(row => {
      const size = SIZE_KEYS[row.motor_sizes?.name];
      const service = SERVICE_KEYS[row.services?.name];
      if (size && service) prices[size][service] = Number(row.price);
    });
    renderPrice();
  }

  function renderPrice() {
    const table = document.getElementById('priceTable');
    if (!table) return;
    const active = document.querySelector('.size-btn.active')?.dataset?.size || 'small';
    const data = prices[active] || {};
    table.innerHTML = `<h3>${esc(SIZE_NAMES[active] || active)} Motorcycle</h3><div class="pricegrid">${SERVICE_ORDER.map(([name,key]) => `<div class="priceitem"><span>${esc(name)}</span><b>${data[key] == null ? '-' : rupiah(data[key])}</b></div>`).join('')}</div>`;
  }

  function updateServices(rows) {
    const container = document.querySelector('.services');
    if (!container) return;
    container.innerHTML = rows.map(service => {
      const content = `<h3>${esc(service.name)}</h3><p>${esc(service.description || '')}</p>`;
      return service.result_url
        ? `<a class="service service-link" href="${esc(service.result_url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
        : `<div class="service">${content}</div>`;
    }).join('');
  }

  function updateCatalog(motors, sizes) {
    const sizeMap = new Map(sizes.map(size => [size.id, SIZE_KEYS[size.name]]));
    catalog = motors.map(motor => ({ brand: motor.brand, model: motor.model, size: sizeMap.get(motor.motor_size_id) })).filter(x => x.size);
    const search = document.getElementById('search');
    if (search && search.value.trim().length >= 2) renderSearch();
  }

  function renderSearch() {
    const search = document.getElementById('search');
    const results = document.getElementById('results');
    if (!search || !results) return;
    const q = search.value.trim().toLowerCase();
    if (q.length < 2) return;
    const hits = catalog.filter(x => `${x.model} ${x.brand}`.toLowerCase().includes(q)).slice(0, 30);
    if (!hits.length) { results.innerHTML = `<div class="result"><strong>Motor tidak ditemukan.</strong></div>`; return; }
    results.innerHTML = hits.map(motor => {
      const data = prices[motor.size] || {};
      return `<div class="result"><strong>${esc(motor.model)}</strong><span class="pill">${esc(motor.brand)}</span><span class="pill">${esc(SIZE_NAMES[motor.size])}</span><div class="pricegrid">${SERVICE_ORDER.map(([name,key]) => `<div class="priceitem"><span>${esc(name)}</span><b>${data[key] == null ? '-' : rupiah(data[key])}</b></div>`).join('')}</div></div>`;
    }).join('');
  }

  function updateSettings(rows) {
    settings = Object.fromEntries(rows.map(row => [row.setting_key, row.setting_value || {}]));
    const instagram = settings.instagram?.url;
    const tiktok = settings.tiktok?.url;
    const maps = settings.google_maps?.url;
    const whatsapp = settings.whatsapp?.number || settings.whatsapp?.url;
    const booking = settings.booking_message?.template || settings.booking_message?.text || '';
    if (instagram) { const el = document.querySelector('.social-card.instagram'); if (el) el.href = instagram; }
    if (tiktok) { const el = document.querySelector('.social-card.tiktok'); if (el) el.href = tiktok; }
    if (maps) { const el = document.querySelector('.social-card.maps'); if (el) el.href = maps; }
    if (whatsapp) {
      const number = String(whatsapp).replace(/\D/g, '');
      const url = `https://wa.me/${number}?text=${encodeURIComponent(booking)}`;
      const social = document.querySelector('.social-card.whatsapp'); if (social) social.href = url;
      const bookingButton = document.querySelector('.booking-button'); if (bookingButton) bookingButton.href = url;
    }
  }

  function addBookingStyles() {
    if (document.getElementById('tmd-booking-styles')) return;
    const style = document.createElement('style');
    style.id = 'tmd-booking-styles';
    style.textContent = `
      .tmd-modal{position:fixed;inset:0;background:rgba(15,23,42,.62);display:none;align-items:flex-end;justify-content:center;padding:12px;z-index:9999}
      .tmd-modal.open{display:flex}
      .tmd-box{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:20px;box-shadow:0 20px 70px #0006}
      .tmd-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      .tmd-head h2{margin:0;color:#111827;font-size:22px}.tmd-close{border:0;background:#eef2f7;border-radius:10px;width:40px;height:40px;font-size:22px;cursor:pointer}
      .tmd-field{margin:0 0 13px}.tmd-field label{display:block;font-size:13px;font-weight:800;color:#374151;margin-bottom:6px}
      .tmd-field input,.tmd-field select,.tmd-field textarea{width:100%;padding:12px;border:1px solid #dbe2ef;border-radius:11px;font:inherit;background:#fff}
      .tmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tmd-price{padding:14px;border-radius:14px;background:#eff6ff;color:#0757d9;font-weight:900;margin:5px 0 14px}
      .tmd-help{font-size:12px;color:#6b7280;margin-top:5px}.tmd-submit{width:100%;border:0;background:#16a34a;color:#fff;padding:14px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer}.tmd-submit:disabled{opacity:.6;cursor:not-allowed}
      .tmd-error{display:none;background:#fef2f2;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px}.tmd-error.show{display:block}
      @media(max-width:520px){.tmd-grid{grid-template-columns:1fr}.tmd-modal{padding:0}.tmd-box{border-radius:22px 22px 0 0}}
    `;
    document.head.appendChild(style);
  }

  function bookingFormMarkup() {
    return `
      <div id="tmdBookingModal" class="tmd-modal" aria-hidden="true">
        <div class="tmd-box" role="dialog" aria-modal="true" aria-labelledby="tmdBookingTitle">
          <div class="tmd-head"><h2 id="tmdBookingTitle">Booking Treatment</h2><button class="tmd-close" id="tmdBookingClose" type="button" aria-label="Tutup">×</button></div>
          <p class="tmd-help" style="margin:0 0 14px">Pilih treatment, tanggal dan jam. Harga akan otomatis mengikuti treatment + size motor.</p>
          <div id="tmdBookingError" class="tmd-error"></div>
          <form id="tmdBookingForm">
            <div class="tmd-field"><label for="tmdName">Nama</label><input id="tmdName" required maxlength="80" autocomplete="name" placeholder="Nama kamu"></div>
            <div class="tmd-field"><label for="tmdTreatment">Treatment</label><select id="tmdTreatment" required><option value="">Pilih treatment...</option></select></div>
            <div class="tmd-field"><label for="tmdMotor">Tipe motor</label><input id="tmdMotor" list="tmdMotorList" required maxlength="100" placeholder="Contoh: Vario 160"><datalist id="tmdMotorList"></datalist><div class="tmd-help">Kalau motor ditemukan di katalog, size otomatis terdeteksi.</div></div>
            <div class="tmd-field"><label for="tmdSize">Size motor</label><select id="tmdSize" required><option value="">Pilih size...</option></select></div>
            <div id="tmdPrice" class="tmd-price">Harga: pilih treatment dan size motor</div>
            <div class="tmd-grid">
              <div class="tmd-field"><label for="tmdDate">Tanggal kedatangan</label><input id="tmdDate" type="date" required></div>
              <div class="tmd-field"><label for="tmdTime">Jam kedatangan</label><select id="tmdTime" required></select></div>
            </div>
            <div class="tmd-field"><label for="tmdPhone">No. HP / WhatsApp</label><input id="tmdPhone" type="tel" required maxlength="30" autocomplete="tel" placeholder="08xxxxxxxxxx"></div>
            <div class="tmd-field"><label for="tmdNotes">Deskripsi kondisi motor <span style="font-weight:400;color:#6b7280">(opsional)</span></label><textarea id="tmdNotes" rows="4" maxlength="1000" placeholder="Contoh: body banyak swirl, ada baret di tangki, dll."></textarea></div>
            <button class="tmd-submit" id="tmdBookingSubmit" type="submit">Lanjut Booking via WhatsApp</button>
          </form>
        </div>
      </div>`;
  }

  function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    if (digits.startsWith('62')) return digits;
    return digits;
  }

  function getWhatsAppNumber() {
    const value = settings.whatsapp?.number || settings.whatsapp?.url || '+6285157597544';
    return normalizePhone(value);
  }

  function getTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 18 && minute > 0) continue;
        slots.push(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
      }
    }
    return slots;
  }

  function getSelectedPrice() {
    const serviceId = document.getElementById('tmdTreatment')?.value;
    const sizeId = document.getElementById('tmdSize')?.value;
    if (!serviceId || !sizeId) return null;
    const row = bookingPrices.find(x => x.service_id === serviceId && x.motor_size_id === sizeId && x.active !== false);
    return row ? Number(row.price) : null;
  }

  function refreshBookingPrice() {
    const box = document.getElementById('tmdPrice');
    if (!box) return;
    const price = getSelectedPrice();
    box.textContent = price == null ? 'Harga: belum tersedia untuk kombinasi ini' : `Harga treatment: ${rupiah(price)}`;
  }

  function detectMotorSize() {
    const input = document.getElementById('tmdMotor');
    const size = document.getElementById('tmdSize');
    if (!input || !size) return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const hit = bookingCatalog.find(m => `${m.brand} ${m.model}`.toLowerCase() === q || m.model.toLowerCase() === q || `${m.brand} ${m.model}`.toLowerCase().includes(q));
    if (hit?.motor_size_id) { size.value = hit.motor_size_id; refreshBookingPrice(); }
  }

  let bookingCatalog = [];

  function populateBookingForm(data) {
    bookingServices = data.services || [];
    bookingSizes = data.sizes || [];
    bookingPrices = data.pricesRaw || [];
    bookingCatalog = data.motors || [];

    const service = document.getElementById('tmdTreatment');
    const size = document.getElementById('tmdSize');
    const list = document.getElementById('tmdMotorList');
    const time = document.getElementById('tmdTime');
    const date = document.getElementById('tmdDate');
    if (!service || !size || !list || !time || !date) return;

    service.innerHTML = '<option value="">Pilih treatment...</option>' + bookingServices.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    size.innerHTML = '<option value="">Pilih size...</option>' + bookingSizes.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    list.innerHTML = bookingCatalog.map(m => `<option value="${esc(m.model)}">${esc(m.brand)} — ${esc(m.model)}</option>`).join('');
    time.innerHTML = '<option value="">Pilih jam...</option>' + getTimeSlots().map(t => `<option value="${t}">${t}</option>`).join('');
    const today = new Date();
    const yyyy = today.getFullYear(); const mm = String(today.getMonth()+1).padStart(2,'0'); const dd = String(today.getDate()).padStart(2,'0');
    date.min = `${yyyy}-${mm}-${dd}`;
    if (!date.value) date.value = `${yyyy}-${mm}-${dd}`;
    refreshBookingPrice();
  }

  function showBookingError(message) {
    const el = document.getElementById('tmdBookingError');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('show', !!message);
  }

  async function submitBooking(event) {
    event.preventDefault();
    showBookingError('');
    const submit = document.getElementById('tmdBookingSubmit');
    const serviceId = document.getElementById('tmdTreatment').value;
    const sizeId = document.getElementById('tmdSize').value;
    const motorType = document.getElementById('tmdMotor').value.trim();
    const date = document.getElementById('tmdDate').value;
    const time = document.getElementById('tmdTime').value;
    const name = document.getElementById('tmdName').value.trim();
    const phone = document.getElementById('tmdPhone').value.trim();
    const notes = document.getElementById('tmdNotes').value.trim();
    const price = getSelectedPrice();
    const service = bookingServices.find(s => s.id === serviceId);
    const size = bookingSizes.find(s => s.id === sizeId);

    if (!name || !serviceId || !sizeId || !motorType || !date || !time || !phone) return showBookingError('Lengkapi data wajib dulu.');
    if (price == null) return showBookingError('Harga untuk treatment dan size motor ini belum tersedia.');
    if (!/^[0-9+\s()-]{8,30}$/.test(phone)) return showBookingError('Nomor HP/WhatsApp tidak valid.');

    submit.disabled = true;
    submit.textContent = 'Menyimpan booking...';
    try {
      const payload = {
        customer_name: name,
        phone,
        motor_type: motorType,
        service_id: serviceId,
        motor_size_id: sizeId,
        appointment_date: date,
        appointment_time: time,
        dp_amount: null,
        notes: notes || null,
        dp_paid: false,
        status: 'pending',
        source: 'whatsapp'
      };
      const { error } = await bookingDb.from('bookings').insert(payload);
      if (error) throw error;

      const message = [
        'Halo THE MOTODETAILERS, saya mau booking treatment.',
        '',
        `Nama: ${name}`,
        `Treatment: ${service?.name || '-'}`,
        `Harga: ${rupiah(price)}`,
        `Tipe motor: ${motorType}`,
        `Size: ${size?.name || '-'}`,
        `Tanggal: ${date}`,
        `Jam: ${time}`,
        `No. HP: ${phone}`,
        notes ? `Kondisi motor: ${notes}` : ''
      ].filter(Boolean).join('\n');
      const url = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
      window.location.href = url;
    } catch (error) {
      console.error('[TMD] Booking error:', error);
      showBookingError(error?.message || 'Booking gagal disimpan. Coba lagi.');
      submit.disabled = false;
      submit.textContent = 'Lanjut Booking via WhatsApp';
    }
  }

  function initBookingFlow(db, data) {
    bookingDb = db;
    addBookingStyles();
    if (!document.getElementById('tmdBookingModal')) document.body.insertAdjacentHTML('beforeend', bookingFormMarkup());
    populateBookingForm(data);

    const button = document.querySelector('.booking-button');
    if (button && !button.dataset.tmdBookingBound) {
      button.dataset.tmdBookingBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        const modal = document.getElementById('tmdBookingModal');
        modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
      });
    }
    document.getElementById('tmdBookingClose')?.addEventListener('click', closeBooking);
    document.getElementById('tmdBookingModal')?.addEventListener('click', event => { if (event.target.id === 'tmdBookingModal') closeBooking(); });
    document.getElementById('tmdBookingForm')?.addEventListener('submit', submitBooking);
    document.getElementById('tmdTreatment')?.addEventListener('change', refreshBookingPrice);
    document.getElementById('tmdSize')?.addEventListener('change', refreshBookingPrice);
    document.getElementById('tmdMotor')?.addEventListener('change', detectMotorSize);
    document.getElementById('tmdMotor')?.addEventListener('blur', detectMotorSize);
  }

  function closeBooking() {
    const modal = document.getElementById('tmdBookingModal');
    if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
    showBookingError('');
  }

  async function start() {
    try {
      const sdk = await loadSupabase();
      const db = sdk.createClient(SUPABASE_URL, SUPABASE_KEY);

      async function getData() {
        const [services, sizes, motors, servicePrices, siteSettings] = await Promise.all([
          db.from('services').select('*').eq('active', true).order('sort_order'),
          db.from('motor_sizes').select('*').eq('active', true).order('sort_order'),
          db.from('motor_catalog').select('*').eq('active', true).order('sort_order'),
          db.from('service_prices').select('id,service_id,motor_size_id,price,active,services(name),motor_sizes(name)').eq('active', true),
          db.from('site_settings').select('setting_key,setting_value')
        ]);
        for (const result of [services, sizes, motors, servicePrices, siteSettings]) if (result.error) throw result.error;
        return { services: services.data || [], sizes: sizes.data || [], motors: motors.data || [], prices: servicePrices.data || [], pricesRaw: servicePrices.data || [], settings: siteSettings.data || [] };
      }

      async function sync() {
        if (syncing) return;
        syncing = true;
        try {
          const data = await getData();
          updatePrices(data.prices);
          updateServices(data.services);
          updateCatalog(data.motors, data.sizes);
          updateSettings(data.settings);
          initBookingFlow(db, data);
          console.log('[TMD] Customer price/data sync OK');
        } catch (error) {
          console.error('[TMD] Customer sync error:', error);
        } finally { syncing = false; }
      }

      const scheduleSync = () => { clearTimeout(timer); timer = setTimeout(sync, 150); };
      document.querySelectorAll('.size-btn').forEach(button => button.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.toggle('active', btn === button));
        renderPrice();
      }));
      const search = document.getElementById('search');
      if (search) search.addEventListener('input', renderSearch);

      await sync();

      db.channel('the-motodetailers-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_prices' }, scheduleSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, scheduleSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'motor_catalog' }, scheduleSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'motor_sizes' }, scheduleSync)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, scheduleSync)
        .subscribe(status => console.log('[TMD] Realtime:', status));

      setInterval(scheduleSync, 5000);
    } catch (error) {
      console.error('[TMD] Startup error:', error);
    }
  }

  start();
})();
