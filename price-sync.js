(() => {
  const SUPABASE_URL = 'https://nbsmkxarkpesjiftmbwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  const rupiah = value => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Number(value) || 0);

  function addStyles() {
    if (document.getElementById('tmd-booking-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'tmd-booking-v2-styles';
    style.textContent = `
      .tmd2-modal{position:fixed;inset:0;background:rgba(15,23,42,.68);display:none;align-items:flex-end;justify-content:center;padding:12px;z-index:99999}
      .tmd2-modal.open{display:flex}
      .tmd2-box{width:min(680px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:22px;padding:20px;box-shadow:0 20px 70px #0006}
      .tmd2-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:5px}
      .tmd2-head h2{margin:0;color:#111827;font-size:22px}.tmd2-close{border:0;background:#eef2f7;border-radius:10px;width:40px;height:40px;font-size:22px;cursor:pointer}
      .tmd2-step{margin:16px 0 0}.tmd2-step-title{font-size:14px;font-weight:900;color:#0757d9;margin-bottom:7px}
      .tmd2-field{margin:0 0 14px}.tmd2-field label{display:block;font-size:13px;font-weight:800;color:#374151;margin-bottom:6px}
      .tmd2-field input,.tmd2-field select,.tmd2-field textarea{width:100%;padding:12px;border:1px solid #dbe2ef;border-radius:11px;font:inherit;background:#fff;outline:none}
      .tmd2-field input:focus,.tmd2-field select:focus,.tmd2-field textarea:focus{border-color:#0757d9;box-shadow:0 0 0 3px #0757d91a}
      .tmd2-help{font-size:12px;color:#6b7280;line-height:1.5;margin-top:5px}
      .tmd2-results{display:grid;gap:9px;margin-top:9px;max-height:270px;overflow:auto}
      .tmd2-result{border:1px solid #e5e7eb;border-radius:14px;padding:12px;cursor:pointer;background:#fff}
      .tmd2-result:hover{border-color:#0757d9;background:#f8fbff}.tmd2-result.selected{border:2px solid #0757d9;background:#eff6ff}
      .tmd2-result-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.tmd2-result-name{font-weight:900;color:#111827}.tmd2-pills{display:flex;gap:5px;flex-wrap:wrap}.tmd2-pill{display:inline-block;background:#eaf1ff;color:#0757d9;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:800}
      .tmd2-mini-prices{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:9px}.tmd2-mini-price{display:flex;justify-content:space-between;gap:6px;border-top:1px solid #edf0f5;padding-top:5px;font-size:11px}.tmd2-mini-price b{color:#0757d9}
      .tmd2-selected{border:1px solid #bfdbfe;background:#eff6ff;border-radius:15px;padding:14px;margin:8px 0 14px}.tmd2-selected h3{margin:0 0 5px;color:#0757d9}.tmd2-price{font-size:20px;font-weight:900;color:#0757d9;margin-top:8px}
      .tmd2-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tmd2-submit{width:100%;border:0;background:#16a34a;color:#fff;padding:14px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer}.tmd2-submit:disabled{opacity:.6;cursor:not-allowed}
      .tmd2-error{display:none;background:#fef2f2;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:13px;margin:10px 0}.tmd2-error.show{display:block}
      @media(max-width:520px){.tmd2-grid{grid-template-columns:1fr}.tmd2-modal{padding:0}.tmd2-box{border-radius:22px 22px 0 0}.tmd2-mini-prices{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function modalMarkup() {
    return `
      <div id="tmdBookingModalV2" class="tmd2-modal" aria-hidden="true">
        <div class="tmd2-box" role="dialog" aria-modal="true" aria-labelledby="tmd2Title">
          <div class="tmd2-head"><h2 id="tmd2Title">Booking Treatment</h2><button id="tmd2Close" class="tmd2-close" type="button" aria-label="Tutup">×</button></div>
          <div class="tmd2-help">Urutan booking: nama → cari tipe motor → pilih treatment → tanggal & jam → nomor HP → kondisi motor.</div>
          <div id="tmd2Error" class="tmd2-error"></div>
          <form id="tmd2Form">
            <div class="tmd2-step"><div class="tmd2-step-title">1. Nama customer</div><div class="tmd2-field"><input id="tmd2Name" required maxlength="80" autocomplete="name" placeholder="Nama customer"></div></div>
            <div class="tmd2-step"><div class="tmd2-step-title">2. Cari tipe motor</div><div class="tmd2-field"><input id="tmd2MotorSearch" required maxlength="100" autocomplete="off" placeholder="Ketik contoh: Beat, Vario 160, NMAX..."><div class="tmd2-help">Ketik minimal 2 karakter. Pilih motor dari hasil pencarian untuk melihat size dan pricelist treatment.</div><div id="tmd2Results" class="tmd2-results"></div></div></div>
            <div id="tmd2TreatmentStep" class="tmd2-step" hidden><div class="tmd2-step-title">3. Pilih treatment</div><div class="tmd2-field"><select id="tmd2Treatment" required><option value="">Pilih treatment...</option></select></div><div id="tmd2Selected" class="tmd2-selected"><div class="tmd2-help">Pilih treatment untuk melihat detail harga.</div></div></div>
            <div id="tmd2ScheduleStep" class="tmd2-step" hidden><div class="tmd2-step-title">4. Waktu & tanggal booking</div><div class="tmd2-grid"><div class="tmd2-field"><label for="tmd2Date">Tanggal kedatangan</label><input id="tmd2Date" type="date" required></div><div class="tmd2-field"><label for="tmd2Time">Jam kedatangan</label><select id="tmd2Time" required><option value="">Pilih jam...</option></select></div></div></div>
            <div id="tmd2ContactStep" class="tmd2-step" hidden><div class="tmd2-step-title">5. No. HP / WhatsApp</div><div class="tmd2-field"><input id="tmd2Phone" type="tel" required maxlength="30" autocomplete="tel" placeholder="08xxxxxxxxxx"></div></div>
            <div id="tmd2NotesStep" class="tmd2-step" hidden><div class="tmd2-step-title">6. Deskripsi kondisi motor <span style="font-weight:400;color:#6b7280">(opsional)</span></div><div class="tmd2-field"><textarea id="tmd2Notes" rows="4" maxlength="1000" placeholder="Contoh: body banyak swirl, ada baret di tangki, dll."></textarea></div></div>
            <button id="tmd2Submit" class="tmd2-submit" type="submit" hidden>Lanjut Booking via WhatsApp</button>
          </form>
        </div>
      </div>`;
  }

  let db;
  let services = [];
  let sizes = [];
  let motors = [];
  let prices = [];
  let selectedMotor = null;
  let selectedPrice = null;
  let selectedService = null;
  let selectedSize = null;

  function slots() {
    const out = [];
    for (let h = 9; h <= 18; h++) {
      for (const m of [0,30]) {
        if (h === 18 && m === 30) continue;
        out.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      }
    }
    return out;
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function setError(message) {
    const el = document.getElementById('tmd2Error');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('show', !!message);
  }

  function showStep(id, show) {
    const el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function servicePrice(serviceId, sizeId) {
    const row = prices.find(p => p.service_id === serviceId && p.motor_size_id === sizeId && p.active !== false);
    return row ? Number(row.price) : null;
  }

  function renderMotorResults(query) {
    const box = document.getElementById('tmd2Results');
    if (!box) return;
    const q = query.trim().toLowerCase();
    if (q.length < 2) { box.innerHTML = ''; return; }
    const hits = motors.filter(m => `${m.brand} ${m.model}`.toLowerCase().includes(q)).slice(0, 20);
    if (!hits.length) { box.innerHTML = '<div class="tmd2-help">Motor tidak ditemukan di katalog. Coba ketik nama lain.</div>'; return; }
    box.innerHTML = hits.map(m => {
      const size = sizes.find(s => s.id === m.motor_size_id);
      const priceItems = prices.filter(p => p.motor_size_id === m.motor_size_id && p.active !== false);
      return `<div class="tmd2-result" data-motor-id="${esc(m.id)}"><div class="tmd2-result-top"><div><div class="tmd2-result-name">${esc(m.brand)} ${esc(m.model)}</div><div class="tmd2-pills"><span class="tmd2-pill">Size: ${esc(size?.name || 'Belum ditentukan')}</span></div></div></div><div class="tmd2-mini-prices">${services.map(s => { const p = priceItems.find(x => x.service_id === s.id); return `<div class="tmd2-mini-price"><span>${esc(s.name)}</span><b>${p ? rupiah(p.price) : '-'}</b></div>`; }).join('')}</div></div>`;
    }).join('');
    box.querySelectorAll('.tmd2-result').forEach(el => el.addEventListener('click', () => selectMotor(el.dataset.motorId)));
  }

  function selectMotor(id) {
    selectedMotor = motors.find(m => m.id === id) || null;
    selectedSize = selectedMotor ? sizes.find(s => s.id === selectedMotor.motor_size_id) || null : null;
    selectedService = null;
    selectedPrice = null;
    const search = document.getElementById('tmd2MotorSearch');
    const treatment = document.getElementById('tmd2Treatment');
    const selected = document.getElementById('tmd2Selected');
    if (!selectedMotor || !treatment || !selected) return;
    search.value = `${selectedMotor.brand} ${selectedMotor.model}`;
    const options = services.map(s => {
      const p = servicePrice(s.id, selectedMotor.motor_size_id);
      return `<option value="${esc(s.id)}" ${p == null ? 'disabled' : ''}>${esc(s.name)} — ${p == null ? 'Harga belum tersedia' : rupiah(p)}</option>`;
    }).join('');
    treatment.innerHTML = '<option value="">Pilih treatment...</option>' + options;
    selected.innerHTML = `<h3>${esc(selectedMotor.brand)} ${esc(selectedMotor.model)}</h3><div class="tmd2-pills"><span class="tmd2-pill">Size: ${esc(selectedSize?.name || '-')}</span></div><div class="tmd2-help">Sekarang pilih treatment yang kamu mau.</div>`;
    showStep('tmd2TreatmentStep', true);
    showStep('tmd2ScheduleStep', false); showStep('tmd2ContactStep', false); showStep('tmd2NotesStep', false);
    document.getElementById('tmd2Submit').hidden = true;
    treatment.focus();
    document.querySelectorAll('.tmd2-result').forEach(x => x.classList.toggle('selected', x.dataset.motorId === id));
  }

  function selectTreatment(id) {
    if (!selectedMotor) return;
    selectedService = services.find(s => s.id === id) || null;
    selectedPrice = selectedService ? servicePrice(selectedService.id, selectedMotor.motor_size_id) : null;
    const selected = document.getElementById('tmd2Selected');
    if (!selected) return;
    selected.innerHTML = `<h3>${esc(selectedService?.name || 'Treatment')}</h3><div class="tmd2-pills"><span class="tmd2-pill">Motor: ${esc(selectedMotor.brand)} ${esc(selectedMotor.model)}</span><span class="tmd2-pill">Size: ${esc(selectedSize?.name || '-')}</span></div><div class="tmd2-price">${selectedPrice == null ? 'Harga belum tersedia' : rupiah(selectedPrice)}</div>`;
    const ready = !!(selectedService && selectedPrice != null);
    showStep('tmd2ScheduleStep', ready); showStep('tmd2ContactStep', ready); showStep('tmd2NotesStep', ready);
    document.getElementById('tmd2Submit').hidden = !ready;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!selectedMotor || !selectedService || selectedPrice == null) return setError('Pilih motor dan treatment dulu.');
    const name = document.getElementById('tmd2Name').value.trim();
    const date = document.getElementById('tmd2Date').value;
    const time = document.getElementById('tmd2Time').value;
    const phone = document.getElementById('tmd2Phone').value.trim();
    const notes = document.getElementById('tmd2Notes').value.trim();
    if (!name || !date || !time || !phone) return setError('Lengkapi data wajib dulu.');
    if (!/^[0-9+\s()-]{8,30}$/.test(phone)) return setError('Nomor HP/WhatsApp tidak valid.');
    if (date < todayISO()) return setError('Tanggal booking tidak boleh lewat.');

    const button = document.getElementById('tmd2Submit');
    button.disabled = true; button.textContent = 'Menyimpan booking...';
    try {
      const payload = {
        customer_name: name,
        phone,
        motor_type: `${selectedMotor.brand} ${selectedMotor.model}`,
        service_id: selectedService.id,
        motor_size_id: selectedMotor.motor_size_id,
        appointment_date: date,
        appointment_time: time,
        dp_amount: null,
        notes: notes || null,
        dp_paid: false,
        status: 'pending',
        source: 'whatsapp'
      };
      const { error } = await db.from('bookings').insert(payload);
      if (error) throw error;
      const message = [
        'Halo THE MOTODETAILERS, saya mau booking treatment.', '',
        `Nama: ${name}`,
        `Tipe motor: ${selectedMotor.brand} ${selectedMotor.model}`,
        `Size motor: ${selectedSize?.name || '-'}`,
        `Treatment: ${selectedService.name}`,
        `Harga: ${rupiah(selectedPrice)}`,
        `Tanggal: ${date}`,
        `Jam: ${time}`,
        `No. HP: ${phone}`,
        notes ? `Deskripsi kondisi motor: ${notes}` : ''
      ].filter(Boolean).join('\n');
      window.location.href = `https://wa.me/6285157597544?text=${encodeURIComponent(message)}`;
    } catch (err) {
      console.error('[TMD] Booking V2 error:', err);
      setError(err?.message || 'Booking gagal disimpan. Coba lagi.');
      button.disabled = false; button.textContent = 'Lanjut Booking via WhatsApp';
    }
  }

  async function init() {
    addStyles();
    const oldModal = document.getElementById('tmdBookingModal');
    if (oldModal) oldModal.remove();
    const oldButton = document.querySelector('.booking-button');
    if (!oldButton) return;
    const newButton = oldButton.cloneNode(true);
    newButton.removeAttribute('href');
    newButton.href = '#booking';
    oldButton.replaceWith(newButton);
    document.body.insertAdjacentHTML('beforeend', modalMarkup());

    const sdk = window.supabase;
    if (!sdk?.createClient) return;
    db = sdk.createClient(SUPABASE_URL, SUPABASE_KEY);
    const [servicesRes, sizesRes, motorsRes, pricesRes] = await Promise.all([
      db.from('services').select('id,name,active,sort_order').eq('active', true).order('sort_order'),
      db.from('motor_sizes').select('id,name,active,sort_order').eq('active', true).order('sort_order'),
      db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order').eq('active', true).order('brand').order('sort_order').limit(1000),
      db.from('service_prices').select('id,service_id,motor_size_id,price,active').eq('active', true)
    ]);
    for (const r of [servicesRes,sizesRes,motorsRes,pricesRes]) if (r.error) throw r.error;
    services = servicesRes.data || []; sizes = sizesRes.data || []; motors = motorsRes.data || []; prices = pricesRes.data || [];

    const timeSelect = document.getElementById('tmd2Time');
    timeSelect.innerHTML = '<option value="">Pilih jam...</option>' + slots().map(t => `<option value="${t}">${t}</option>`).join('');
    const date = document.getElementById('tmd2Date');
    date.min = todayISO(); date.value = todayISO();

    newButton.addEventListener('click', e => { e.preventDefault(); const modal = document.getElementById('tmdBookingModalV2'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
    document.getElementById('tmd2Close').addEventListener('click', close);
    document.getElementById('tmdBookingModalV2').addEventListener('click', e => { if (e.target.id === 'tmdBookingModalV2') close(); });
    document.getElementById('tmd2Form').addEventListener('submit', submit);
    document.getElementById('tmd2MotorSearch').addEventListener('input', e => { selectedMotor = null; selectedService = null; selectedPrice = null; showStep('tmd2TreatmentStep', false); showStep('tmd2ScheduleStep', false); showStep('tmd2ContactStep', false); showStep('tmd2NotesStep', false); document.getElementById('tmd2Submit').hidden = true; renderMotorResults(e.target.value); });
    document.getElementById('tmd2Treatment').addEventListener('change', e => selectTreatment(e.target.value));
  }

  function close() {
    const modal = document.getElementById('tmdBookingModalV2');
    if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(() => init().catch(err => console.error('[TMD] Booking init error:', err)), 400));
})();
