(() => {
  const SUPABASE_URL =
    'https://nbsmkxarkpesjiftmbwm.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

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

  const SIZE_MAP = {
    'Small': 'small',
    'Medium': 'medium',
    'Large': 'large',
    'X-tra Large': 'xlarge',
    'Xtra Large': 'xlarge',
    'Super Large': 'super'
  };

  async function loadPrices() {
    try {
      const response = await fetch(
        SUPABASE_URL +
          '/rest/v1/service_prices' +
          '?select=price,active,services(name),motor_sizes(name)' +
          '&active=eq.true' +
          '&_=' +
          Date.now(),
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Supabase HTTP ${response.status}`
        );
      }

      const rows = await response.json();

      const prices = {
        small: {},
        medium: {},
        large: {},
        xlarge: {},
        super: {}
      };

      rows.forEach(row => {
        const size =
          SIZE_MAP[row.motor_sizes?.name];

        const service =
          SERVICE_MAP[row.services?.name];

        if (
          !size ||
          !service ||
          row.price == null
        ) {
          return;
        }

        prices[size][service] =
          Number(row.price);
      });

      if (
        typeof window.prices === 'object' &&
        window.prices
      ) {
        Object.keys(prices).forEach(size => {
          Object.keys(prices[size]).forEach(service => {
            window.prices[size][service] =
              prices[size][service];
          });
        });
      }

      const activeButton =
        document.querySelector('.size-btn.active');

      const activeSize =
        activeButton?.dataset?.size || 'small';

      if (
        typeof window.showPrice === 'function'
      ) {
        window.showPrice(activeSize);
      }

      document
        .querySelectorAll('.size-btn')
        .forEach(button => {
          if (
            button.dataset.priceSyncBound === '1'
          ) {
            return;
          }

          button.dataset.priceSyncBound = '1';

          button.addEventListener('click', () => {
            setTimeout(() => {
              if (
                typeof window.showPrice ===
                'function'
              ) {
                window.showPrice(
                  button.dataset.size
                );
              }
            }, 0);
          });
        });

      console.log(
        'Harga customer berhasil disinkronkan:',
        prices
      );

    } catch (error) {
      console.error(
        'Gagal mengambil harga terbaru:',
        error
      );
    }
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      loadPrices,
      { once: true }
    );
  } else {
    loadPrices();
  }
})();
