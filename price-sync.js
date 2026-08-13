(function () {
  const SUPABASE_URL =
    'https://nbsmkxarkpesjiftmbwm.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';

  const SIZE_KEY = {
    'Small': 'small',
    'Medium': 'medium',
    'Large': 'large',
    'X-tra Large': 'xlarge',
    'Xtra Large': 'xlarge',
    'Super Large': 'super'
  };

  const SERVICE_KEY = {
    'Premium Wash': 'premium',
    'Glossin Aja': 'glossAja',
    'Glossin Pro': 'glossPro',
    'Detailin Pro': 'detailin',
    'NanoShine': 'nano',
    'Cuci Rangka Pro': 'frame',
    'NanoShine Express': 'nanoExpress',
    'Detailing Doff': 'doff'
  };

  const SERVICE_NAMES = [
    ['Premium Wash', 'premium'],
    ['Glossin Aja', 'glossAja'],
    ['Glossin Pro', 'glossPro'],
    ['Detailin Pro', 'detailin'],
    ['NanoShine', 'nano'],
    ['Cuci Rangka Pro', 'frame'],
    ['NanoShine Express', 'nanoExpress'],
    ['Detailing Doff', 'doff']
  ];

  const money = value =>
    'Rp ' + Number(value || 0).toLocaleString('id-ID');

  async function getLatestPrices() {
    const url =
      SUPABASE_URL +
      '/rest/v1/service_prices' +
      '?select=price,active,services(name),motor_sizes(name)' +
      '&active=eq.true' +
      '&_ts=' +
      Date.now();

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(
        'Supabase Price API error: ' +
        response.status
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

    for (const row of rows) {
      const size =
        SIZE_KEY[row.motor_sizes?.name];

      const service =
        SERVICE_KEY[row.services?.name];

      const value =
        Number(row.price);

      if (
        !size ||
        !service ||
        !Number.isFinite(value)
      ) {
        continue;
      }

      prices[size][service] = value;
    }

    return prices;
  }

  function updateExistingPriceObject(latest) {
    try {
      if (
        typeof window.prices !== 'undefined' &&
        window.prices
      ) {
        for (const size of Object.keys(latest)) {
          if (!window.prices[size]) {
            window.prices[size] = {};
          }

          for (
            const service of Object.keys(latest[size])
          ) {
            window.prices[size][service] =
              latest[size][service];
          }
        }
      }
    } catch (error) {
      console.warn(
        'Tidak bisa update object prices:',
        error
      );
    }
  }

  function renderCustomerPriceTable(latest) {
    const table =
      document.getElementById('priceTable');

    if (!table) {
      console.warn(
        'priceTable tidak ditemukan.'
      );
      return;
    }

    const activeButton =
      document.querySelector(
        '.size-btn.active'
      );

    const size =
      activeButton?.dataset?.size ||
      'small';

    const data =
      latest[size] || {};

    const html =
      SERVICE_NAMES.map(
        ([label, key]) => {
          const value = data[key];

          if (
            value === undefined ||
            value === null
          ) {
            return '';
          }

          return `
            <div class="priceitem">
              <span>${label}</span>
              <b>${money(value)}</b>
            </div>
          `;
        }
      ).join('');

    if (html.trim()) {
      table.innerHTML = html;
    }
  }

  function bindSizeButtons(latest) {
    document
      .querySelectorAll('.size-btn')
      .forEach(button => {
        if (
          button.dataset.priceSyncBound === '1'
        ) {
          return;
        }

        button.dataset.priceSyncBound = '1';

        button.addEventListener(
          'click',
          () => {
            setTimeout(() => {
              renderCustomerPriceTable(
                latest
              );
            }, 0);
          }
        );
      });
  }

  async function syncPrices() {
    try {
      const latest =
        await getLatestPrices();

      if (
        !latest ||
        Object.keys(latest).length === 0
      ) {
        console.warn(
          'Tidak ada harga aktif dari Supabase.'
        );
        return;
      }

      updateExistingPriceObject(
        latest
      );

      renderCustomerPriceTable(
        latest
      );

      bindSizeButtons(
        latest
      );

      /*
       * Paksa render ulang setelah
       * halaman selesai menjalankan
       * script-script lainnya.
       */
      setTimeout(() => {
        renderCustomerPriceTable(
          latest
        );
      }, 500);

      setTimeout(() => {
        renderCustomerPriceTable(
          latest
        );
      }, 1500);

      console.log(
        'Harga customer berhasil disinkronkan dari Supabase.'
      );

    } catch (error) {
      console.warn(
        'Gagal mengambil harga terbaru dari Supabase:',
        error
      );

      /*
       * Kalau Supabase gagal,
       * harga bawaan halaman tetap digunakan.
       */
    }
  }

  /*
   * Jalankan setelah DOM siap.
   */
  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      syncPrices,
      { once: true }
    );
  } else {
    syncPrices();
  }

})();
