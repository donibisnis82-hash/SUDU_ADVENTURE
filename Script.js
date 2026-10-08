/* =================================
   KONFIGURASI
================================= */

const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbz5UlFqaHzcxPVRXZTnQr8r59gOTw8URNX70qYIl157wURwZaR8q_gznRKpaIU17Y7ZFQ/exec";

const NOMOR_WA_RENTAL =
"6285182673441";

const DURASI_SEWA = 2;

let keranjang = [];


/* =================================
   DATA ALAT
================================= */
const products = [

  {
    id: 1,
    nama: "Tenda 2 Layer Kap 4",
    harga: 35000,
    gambar: "tenda.jpg",
    kategori: "Tenda"
  },

  {
    id: 2,
    nama: "Tenda Bongkar Pasang",
    harga: 50000,
    gambar: "tenda-bongkar.jpg",
    kategori: "Tenda"
  },

  {
    id: 3,
    nama: "Flysheet 3x4",
    harga: 15000,
    gambar: "flysheet.jpg",
    kategori: "Tenda"
  },

  {
    id: 4,
    nama: "Keril Lokal 60L–70L",
    harga: 20000,
    gambar: "keril-lokal.jpg",
    kategori: "Outdoor"
  },

  {
    id: 5,
    nama: "Hydropack",
    harga: 20000,
    gambar: "hydropack.jpg",
    kategori: "Outdoor"
  },

  {
    id: 6,
    nama: "Sleeping Bag",
    harga: 10000,
    gambar: "sleeping-bag.jpg",
    kategori: "Camping"
  },

  {
    id: 7,
    nama: "Matras",
    harga: 5000,
    gambar: "matras.jpg",
    kategori: "Camping"
  },

  {
    id: 8,
    nama: "Headlamp Biasa",
    harga: 5000,
    gambar: "headlamp-biasa.jpg",
    kategori: "Outdoor"
  },

  {
    id: 9,
    nama: "Headlamp Luby/Aoki",
    harga: 15000,
    gambar: "headlamp-aoki.jpg",
    kategori: "Outdoor"
  },

  {
    id: 10,
    nama: "Lampu Tenda",
    harga: 5000,
    gambar: "lampu-tenda.jpg",
    kategori: "Camping"
  },

  {
    id: 11,
    nama: "Jaket Outdoor",
    harga: 20000,
    gambar: "jaket.jpg",
    kategori: "Outdoor"
  },

  {
    id: 12,
    nama: "Sepatu Outdoor",
    harga: 25000,
    gambar: "sepatu.jpg",
    kategori: "Outdoor"
  },

  {
    id: 13,
    nama: "Gas Refil",
    harga: 10000,
    gambar: "gas.jpg",
    kategori: "Cooking"
  },

  {
    id: 14,
    nama: "Kompor Portable",
    harga: 10000,
    gambar: "kompor.jpg",
    kategori: "Cooking"
  },

  {
    id: 15,
    nama: "Kompor BBQ",
    harga: 20000,
    gambar: "bbq.jpg",
    kategori: "Cooking"
  },

  {
    id: 16,
    nama: "Pan/Wajan",
    harga: 10000,
    gambar: "pan.jpg",
    kategori: "Cooking"
  },

  {
    id: 17,
    nama: "Nesting DS200",
    harga: 10000,
    gambar: "nesting-ds200.jpg",
    kategori: "Cooking"
  },

  {
    id: 18,
    nama: "Nesting DS500",
    harga: 15000,
    gambar: "nesting-ds500.jpg",
    kategori: "Cooking"
  },

  {
    id: 19,
    nama: "Cooking 1 Set",
    harga: 25000,
    gambar: "cooking-set.jpg",
    kategori: "Cooking"
  },

  {
    id: 20,
    nama: "Tracking Pole",
    harga: 10000,
    gambar: "tracking-pole.jpg",
    kategori: "Outdoor"
  },
  
  {
    id: 21,
    nama: "kursi Lipat",
    harga: 10000,
    gambar: "kursi.jpg",
    kategori: "Camping"
  },

  {
     id: 22,
    nama: "Meja Lipat",
    harga: 10000,
    gambar: "meja.jpg",
    kategori: "Camping"
  },
  {
     id: 22,
    nama: "Batal Angin",
    harga: 6000,
    gambar: "bantal.jpg",
    kategori: "Camping"
  }
  
];





/* =================================
   FORMAT RUPIAH
================================= */

function rupiah(angka) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(angka);

}


/* =================================
   TANGGAL
================================= */

function formatDateInput(date) {

  const y =
    date.getFullYear();

  const m =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const d =
    String(date.getDate())
      .padStart(2, "0");

  return `${y}-${m}-${d}`;

}


function formatDateIndonesia(value) {

  if (!value) return "-";

  const date =
    new Date(value + "T00:00:00");

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );

}


/* =================================
   MINIMUM TANGGAL
================================= */

function setMinDate() {

  const mulai =
    document.getElementById("mulai");

  const kembali =
    document.getElementById("kembali");

  const today =
    new Date();

  const todayString =
    formatDateInput(today);

  mulai.min =
    todayString;

  kembali.min =
    todayString;

}


/* =================================
   TANGGAL KEMBALI
================================= */

function ubahTanggalKembali() {

  const mulai =
    document.getElementById("mulai").value;

  const kembali =
    document.getElementById("kembali");

  if (!mulai) return;

  const date =
    new Date(mulai + "T00:00:00");

  date.setDate(
    date.getDate() + DURASI_SEWA
  );

  kembali.min =
    mulai;

  kembali.value =
    formatDateInput(date);

}


/* =================================
   RENDER PRODUK
================================= */

let kategoriAktif = "Semua";
let pencarianAktif = "";


function renderProducts() {

  const container =
    document.getElementById("products");

  const noProduct =
    document.getElementById("noProduct");


  container.innerHTML = "";


  const hasil =
    products.filter(product => {

      const cocokKategori =
        kategoriAktif === "Semua" ||
        product.kategori === kategoriAktif;


      const cocokPencarian =
        product.nama
          .toLowerCase()
          .includes(
            pencarianAktif.toLowerCase()
          );


      return cocokKategori &&
             cocokPencarian;

    });


  if (hasil.length === 0) {

    noProduct.style.display =
      "block";

    return;

  }


  noProduct.style.display =
    "none";


  hasil.forEach(product => {

    const item =
      keranjang.find(
        x => x.id === product.id
      );


    const jumlah =
      item ? item.jumlah : 0;


    const card =
      document.createElement("div");

    card.className =
      "product-card";


    card.innerHTML = `

      <div class="pic">

        <img
          src="${product.gambar}"
          alt="${product.nama}"
          onerror="this.src='Logo baru.png'"
        >

      </div>


      <div class="product-info">

        <small style="
          color:#a47b12;
          font-weight:700;
        ">
          ${product.kategori}
        </small>

        <h3>
          ${product.nama}
        </h3>

        <div class="product-price">
          ${rupiah(product.harga)} / hari
        </div>


        <div class="product-actions">

          <div class="qty">

            <button
              onclick="ubahJumlah(${product.id}, -1)"
            >
              −
            </button>

            <span>
              ${jumlah}
            </span>

            <button
              onclick="ubahJumlah(${product.id}, 1)"
            >
              +
            </button>

          </div>


          <button
            class="add-button"
            onclick="ubahJumlah(${product.id}, 1)"
          >
            Tambah
          </button>

        </div>

      </div>

    `;


    container.appendChild(card);

  });

}


/* =================================
   UBAH JUMLAH
================================= */

function ubahJumlah(id, delta) {

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;


  let item =
    keranjang.find(
      x => x.id === id
    );


  if (!item && delta > 0) {

    keranjang.push({

      id: product.id,

      nama: product.nama,

      harga: product.harga,

      jumlah: 1

    });


    tampilkanToast(
      `${product.nama} ditambahkan ke booking`
    );

  }

  else if (item) {

    item.jumlah += delta;


    if (item.jumlah <= 0) {

      keranjang =
        keranjang.filter(
          x => x.id !== id
        );


      tampilkanToast(
        `${product.nama} dihapus dari booking`
      );

    }

    else if (delta > 0) {

      tampilkanToast(
        `${product.nama} ditambahkan`
      );

    }

  }


  renderProducts();

  renderCart();

  hitungTotal();

}


/* =================================
   RENDER KERANJANG
================================= */

function renderCart() {

  const cart =
    document.getElementById("cart");

  if (!cart) return;


  if (keranjang.length === 0) {

    cart.innerHTML = `

      <p class="empty-cart">
        Belum ada alat yang dipilih.
      </p>

    `;

    return;

  }


  cart.innerHTML = "";


  keranjang.forEach(item => {

    const div =
      document.createElement("div");

    div.className =
      "cart-item";


    div.innerHTML = `

      <div>

        <strong>
          ${item.nama}
        </strong>

        <br>

        <small>
          ${item.jumlah} × ${rupiah(item.harga)}
        </small>

      </div>


      <strong>
        ${rupiah(item.harga * item.jumlah)}
      </strong>

    `;


    cart.appendChild(div);

  });

}


/* =================================
   TOTAL
================================= */

function hitungTotal() {

  let total = 0;


  keranjang.forEach(item => {

    total +=
      item.harga * item.jumlah;

  });


  const element =
    document.getElementById("total");

  if (element) {

    element.textContent =
      rupiah(total);

  }


  return total;

}


/* =================================
   VALIDASI WA
================================= */

function validasiWA(nomor) {

  nomor =
    nomor.replace(/\D/g, "");


  if (nomor.startsWith("0")) {

    nomor =
      "62" + nomor.substring(1);

  }


  if (
    nomor.startsWith("62") &&
    nomor.length >= 10
  ) {

    return nomor;

  }


  return null;

}


/* =================================
   PESAN WHATSAPP
================================= */

function buatPesanWhatsApp(
  data,
  nomorBooking
) {

  let items = "";


  data.items.forEach(item => {

    items +=
      `• ${item.nama} x${item.jumlah} = ${rupiah(item.harga * item.jumlah)}\n`;

  });


  return `

Halo Sudut Camp 👋

Saya ingin melakukan konfirmasi booking.

Nomor Booking:
${nomorBooking}

Nama:
${data.nama}

Tanggal:
${formatDateIndonesia(data.mulai)}
s/d
${formatDateIndonesia(data.kembali)}

Perlengkapan:
${items}

Total:
${rupiah(data.total)}

Terima kasih.

  `.trim();

}


/* =================================
   TAMPILKAN HASIL
================================= */

function tampilkanHasil(
  data,
  nomorBooking
) {

  document.getElementById(
    "resultNo"
  ).textContent =
    nomorBooking;


  document.getElementById(
    "resultNama"
  ).textContent =
    data.nama;


  document.getElementById(
    "resultTanggal"
  ).textContent =
    `${formatDateIndonesia(data.mulai)} - ${formatDateIndonesia(data.kembali)}`;


  document.getElementById(
    "resultItems"
  ).textContent =
    data.items
      .map(
        item =>
          `${item.nama} x${item.jumlah}`
      )
      .join(", ");


  document.getElementById(
    "resultTotal"
  ).textContent =
    rupiah(data.total);


  const pesan =
    buatPesanWhatsApp(
      data,
      nomorBooking
    );


  document.getElementById(
    "waButton"
  ).href =
    `https://wa.me/${NOMOR_WA_RENTAL}?text=${encodeURIComponent(pesan)}`;


  document.getElementById(
    "result"
  ).style.display =
    "block";

}


/* =================================
   BOOKING
================================= */

async function booking() {

  const nama =
    document.getElementById("nama").value.trim();

  const wa =
    document.getElementById("wa").value.trim();

  const mulai =
    document.getElementById("mulai").value;

  const kembali =
    document.getElementById("kembali").value;


  if (!nama) {

    alert("Nama belum diisi.");

    return;

  }


  const nomorWA =
    validasiWA(wa);


  if (!nomorWA) {

    alert(
      "Nomor WhatsApp tidak valid."
    );

    return;

  }


  if (!mulai || !kembali) {

    alert(
      "Silakan isi tanggal sewa."
    );

    return;

  }


  if (kembali < mulai) {

    alert(
      "Tanggal kembali tidak boleh sebelum tanggal mulai."
    );

    return;

  }


  if (keranjang.length === 0) {

    alert(
      "Silakan pilih alat terlebih dahulu."
    );

    return;

  }


  const total =
    hitungTotal();


  const data = {

    nama: nama,

    wa: nomorWA,

    mulai: mulai,

    kembali: kembali,

    items: keranjang,

    total: total

  };


  const button =
    document.getElementById(
      "bookingButton"
    );


  button.disabled = true;

  button.textContent =
    "⏳ Mengirim...";


  try {

    const response =
      await fetch(
        GOOGLE_SCRIPT_URL,
        {

          method: "POST",

          mode: "cors",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(data)

        }
      );


    const hasil =
      await response.json();


    if (!hasil.success) {

      throw new Error(
        hasil.message ||
        "Booking gagal."
      );

    }


    tampilkanHasil(
      data,
      hasil.nomorBooking
    );


    alert(
      "Booking berhasil disimpan."
    );


  }

  catch (error) {

    console.error(error);

    alert(
      "Booking gagal dikirim.\n\n" +
      "Pastikan Google Apps Script sudah aktif."
    );

  }


  finally {

    button.disabled = false;

    button.textContent =
      "Booking Sekarang";

  }

}


/* =================================
   EVENT
================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setMinDate();

    renderProducts();

    renderCart();

    hitungTotal();


    const mulai =
      document.getElementById("mulai");


    if (mulai) {

      mulai.addEventListener(
        "change",
        ubahTanggalKembali
      );

    }

  }
);
/* =================================
   MENU MOBILE
================================= */

const menuToggle =
  document.getElementById("menuToggle");

const navMenu =
  document.getElementById("navMenu");


if (menuToggle && navMenu) {

  menuToggle.addEventListener(
    "click",
    () => {

      navMenu.classList.toggle("active");

      if (
        navMenu.classList.contains("active")
      ) {

        menuToggle.textContent = "✕";

      } else {

        menuToggle.textContent = "☰";

      }

    }
  );


  // Tutup menu setelah memilih menu

  navMenu
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          navMenu.classList.remove(
            "active"
          );

          menuToggle.textContent = "☰";

        }
        );
    });
}
/* =================================
   SEARCH PRODUK
================================= */

const searchProduct =
  document.getElementById(
    "searchProduct"
  );


if (searchProduct) {

  searchProduct.addEventListener(
    "input",
    function() {

      pencarianAktif =
        this.value.trim();

      renderProducts();

    }
  );

}


/* =================================
   KATEGORI PRODUK
================================= */

const categoryButtons =
  document.querySelectorAll(
    ".category-btn"
  );


categoryButtons.forEach(button => {

  button.addEventListener(
    "click",
    function() {

      categoryButtons.forEach(btn => {

        btn.classList.remove(
          "active"
        );

      });


      this.classList.add("active");


      kategoriAktif =
        this.dataset.category;


      renderProducts();

    }
  );

});

/* =================================
   NOTIFIKASI
================================= */

let toastTimer;


function tampilkanToast(pesan) {

  const toast =
    document.getElementById("toast");

  if (!toast) return;


  clearTimeout(toastTimer);


  toast.textContent =
    "✅ " + pesan;


  toast.classList.add("show");


  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2500);

}
// =====================================================
// DARK MODE
// =====================================================

const darkModeBtn =
  document.getElementById("darkModeBtn");

if (darkModeBtn) {

  const temaTersimpan =
    localStorage.getItem("sudutTheme");

  if (temaTersimpan === "dark") {

    document.body.classList.add("dark-mode");

    darkModeBtn.textContent = "☀️";

  }

  darkModeBtn.addEventListener(
    "click",
    function() {

      document.body.classList.toggle(
        "dark-mode"
      );

      if (
        document.body.classList.contains(
          "dark-mode"
        )
      ) {

        darkModeBtn.textContent = "☀️";

        localStorage.setItem(
          "sudutTheme",
          "dark"
        );

      } else {

        darkModeBtn.textContent = "🌙";

        localStorage.setItem(
          "sudutTheme",
          "light"
        );

      }

    }
  );

}


// =====================================================
// LOADING SCREEN
// =====================================================

window.addEventListener(
  "load",
  function() {

    const loading =
      document.getElementById(
        "loadingScreen"
      );

    if (!loading) return;

    setTimeout(
      function() {

        loading.classList.add("hide");

      },
      700
    );

  }
);
