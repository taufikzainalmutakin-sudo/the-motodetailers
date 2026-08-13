(() => {
  const SUPABASE_URL =
    'https://nbsmkxarkpesjiftmbwm.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

  const { createClient } = window.supabase;

  const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

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
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'Xtra Large',
    super: 'Super Large'
  };

  const SERVICE_ORDER = [
    ['Premium Wash', 'premium'],
    ['Glossin Aja', 'glossAja'],
    ['Glossin Pro', 'glossPro'],
    ['Detailin Pro', 'detailin'],
    ['NanoShine', 'nano'],
    ['NanoShine Express', 'nanoExpress'],
    ['Detailing Doff', 'doff'],
    ['Cuci Rangka Pro', 'frame']
  ];

  const rupiah = value =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const esc = value =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  let prices = {
    small: {},
    medium: {},
    large: {},
    xlarge: {},
    super: {}
  };

  let catalog = [];
  let settings = {};

  let timer = null;
  let syncing = false;

  async function getData() {

    const [
      services,
      sizes,
      motors,
      servicePrices,
      siteSettings
    ] = await Promise.all([

      db
        .from('services')
        .select('*')
        .eq('active', true)
        .order('sort_order'),

      db
        .from('motor_sizes')
        .select('*')
        .eq('active', true)
        .order('sort_order'),

      db
        .from('motor_catalog')
        .select('*')
        .eq('active', true)
        .order('sort_order'),

      db
        .from('service_prices')
        .select(
          'price,active,services(name),motor_sizes(name)'
        )
        .eq('active', true),

      db
        .from('site_settings')
        .select('setting_key,setting_value')
    ]);

    if (services.error) throw services.error;
    if (sizes.error) throw sizes.error;
    if (motors.error) throw motors.error;
    if (servicePrices.error) throw servicePrices.error;
    if (siteSettings.error) throw siteSettings.error;

    return {
      services: services.data || [],
      sizes: sizes.data || [],
      motors: motors.data || [],
      prices: servicePrices.data || [],
      settings: siteSettings.data || []
    };
  }

  function updatePrices(rows) {

    prices = {
      small: {},
      medium: {},
      large: {},
      xlarge: {},
      super: {}
    };

    rows.forEach(row => {

      const size =
        SIZE_KEYS[row.motor_sizes?.name];

      const service =
        SERVICE_KEYS[row.services?.name];

      if (!size || !service) return;

      prices[size][service] =
        Number(row.price);
    });

    renderPrice();
  }

  function renderPrice() {

    const table =
      document.getElementById('priceTable');

    if (!table) return;

    const active =
      document.querySelector(
        '.size-btn.active'
      )?.dataset?.size || 'small';

    const data =
      prices[active] || {};

    table.innerHTML = `
      <h3>
        ${esc(
          SIZE_NAMES[active] || active
        )} Motorcycle
      </h3>

      <div class="pricegrid">

        ${SERVICE_ORDER.map(
          ([name, key]) => `
            <div class="priceitem">
              <span>${esc(name)}</span>
              <b>
                ${
                  data[key] == null
                    ? '-'
                    : rupiah(data[key])
                }
              </b>
            </div>
          `
        ).join('')}

      </div>
    `;
  }

  function updateServices(rows) {

    const container =
      document.querySelector('.services');

    if (!container) return;

    container.innerHTML =
      rows.map(service => {

        const content = `
          <h3>${esc(service.name)}</h3>
          <p>
            ${esc(service.description || '')}
          </p>
        `;

        if (service.result_url) {
          return `
            <a
              class="service service-link"
              href="${esc(service.result_url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${content}
            </a>
          `;
        }

        return `
          <div class="service">
            ${content}
          </div>
        `;

      }).join('');
  }

  function updateCatalog(
    motors,
    sizes
  ) {

    const sizeMap =
      new Map(
        sizes.map(size => [
          size.id,
          SIZE_KEYS[size.name]
        ])
      );

    catalog =
      motors
        .map(motor => ({
          brand: motor.brand,
          model: motor.model,
          size:
            sizeMap.get(
              motor.motor_size_id
            )
        }))
        .filter(
          motor => motor.size
        );

    const search =
      document.getElementById('search');

    if (
      search &&
      search.value.trim().length >= 2
    ) {
      renderSearch();
    }
  }

  function renderSearch() {

    const search =
      document.getElementById('search');

    const results =
      document.getElementById('results');

    if (!search || !results) return;

    const q =
      search.value
        .trim()
        .toLowerCase();

    if (q.length < 2) return;

    const hits =
      catalog
        .filter(motor =>
          `${motor.model} ${motor.brand}`
            .toLowerCase()
            .includes(q)
        )
        .slice(0, 30);

    if (!hits.length) {
      results.innerHTML = `
        <div class="result">
          <strong>
            Motor tidak ditemukan.
          </strong>
        </div>
      `;
      return;
    }

    results.innerHTML =
      hits.map(motor => {

        const data =
          prices[motor.size] || {};

        return `
          <div class="result">

            <strong>
              ${esc(motor.model)}
            </strong>

            <span class="pill">
              ${esc(motor.brand)}
            </span>

            <span class="pill">
              ${
                esc(
                  SIZE_NAMES[motor.size]
                )
              }
            </span>

            <div class="pricegrid">

              ${SERVICE_ORDER.map(
                ([name, key]) => `
                  <div class="priceitem">
                    <span>
                      ${esc(name)}
                    </span>

                    <b>
                      ${
                        data[key] == null
                          ? '-'
                          : rupiah(data[key])
                      }
                    </b>
                  </div>
                `
              ).join('')}

            </div>

          </div>
        `;

      }).join('');
  }

  function updateSettings(rows) {

    settings =
      Object.fromEntries(
        rows.map(row => [
          row.setting_key,
          row.setting_value || {}
        ])
      );

    const whatsapp =
      settings.whatsapp?.number;

    const instagram =
      settings.instagram?.url;

    const tiktok =
      settings.tiktok?.url;

    const maps =
      settings.google_maps?.url;

    const booking =
      settings.booking_message?.template || '';

    if (instagram) {
      const el =
        document.querySelector(
          '.social-card.instagram'
        );

      if (el) el.href = instagram;
    }

    if (tiktok) {
      const el =
        document.querySelector(
          '.social-card.tiktok'
        );

      if (el) el.href = tiktok;
    }

    if (maps) {
      const el =
        document.querySelector(
          '.social-card.maps'
        );

      if (el) el.href = maps;
    }

    if (whatsapp) {

      const number =
        String(whatsapp)
          .replace(/\D/g, '');

      const url =
        `https://wa.me/${number}` +
        `?text=${encodeURIComponent(
          booking
        )}`;

      const social =
        document.querySelector(
          '.social-card.whatsapp'
        );

      if (social) {
        social.href = url;
      }

      const bookingButton =
        document.querySelector(
          '.booking-button'
        );

      if (bookingButton) {
        bookingButton.href = url;
      }
    }
  }

  async function sync() {

    if (syncing) return;

    syncing = true;

    try {

      const data =
        await getData();

      updatePrices(
        data.prices
      );

      updateServices(
        data.services
      );

      updateCatalog(
        data.motors,
        data.sizes
      );

      updateSettings(
        data.settings
      );

      console.log(
        '[TMD] Customer synced'
      );

    } catch (error) {

      console.error(
        '[TMD] Sync error:',
        error
      );

    } finally {
      syncing = false;
    }
  }

  function scheduleSync() {

    clearTimeout(timer);

    timer =
      setTimeout(
        sync,
        150
      );
  }

  document
    .querySelectorAll('.size-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          document
            .querySelectorAll(
              '.size-btn'
            )
            .forEach(btn =>
              btn.classList.toggle(
                'active',
                btn === button
              )
            );

          renderPrice();
        }
      );

    });

  const search =
    document.getElementById('search');

  if (search) {

    search.addEventListener(
      'input',
      renderSearch
    );

  }

  // Load pertama
  sync();

  // REAL-TIME
  db
    .channel(
      'the-motodetailers-live'
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'service_prices'
      },
      scheduleSync
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'services'
      },
      scheduleSync
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'motor_catalog'
      },
      scheduleSync
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'motor_sizes'
      },
      scheduleSync
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'site_settings'
      },
      scheduleSync
    )

    .subscribe(
      status => {
        console.log(
          '[TMD] Realtime:',
          status
        );
      }
    );

})();
