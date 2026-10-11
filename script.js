/* =====================================================
   SUDUT CAMP RENTAL - SCRIPT RINGAN + FITUR LENGKAP
===================================================== */

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyIh0SwW8aZ7j05qrumzUdI6GtEnIl1wuHV96LXbLIpAOqAgWzJBr__Q7eXkvxJ-fGz7A/exec";
const NOMOR_WA_RENTAL = "6285182673441";
const DURASI_SEWA_DEFAULT = 2;

const products = [
  {id:1,nama:"Tenda 2 Layer Kap 4",harga:35000,gambar:"tenda.jpg",kategori:"Tenda",badge:"🔥 Populer"},
  {id:2,nama:"Tenda Bongkar Pasang (Khusus Puncak Tombo)",harga:50000,gambar:"tenda-bongkar.jpg",kategori:"Tenda",badge:"📍 Puncak Tombo • Bebas Denda",areaKhusus:"Puncak Tombo",bebasDenda:true},
  {id:3,nama:"Flysheet 3x4",harga:15000,gambar:"flysheet.jpg",kategori:"Tenda"},
  {id:4,nama:"Keril Lokal 60L–70L",harga:20000,gambar:"keril-lokal.jpg",kategori:"Outdoor",badge:"🔥 Populer"},
  {id:5,nama:"Hydropack",harga:20000,gambar:"hydropack.jpg",kategori:"Outdoor"},
  {id:6,nama:"Sleeping Bag",harga:10000,gambar:"sleeping-bag.jpg",kategori:"Camping",badge:"🔥 Populer"},
  {id:7,nama:"Matras",harga:5000,gambar:"matras.jpg",kategori:"Camping"},
  {id:8,nama:"Headlamp Biasa",harga:5000,gambar:"headlamp-biasa.jpg",kategori:"Outdoor"},
  {id:9,nama:"Headlamp Luby/Aoki",harga:15000,gambar:"headlamp-aoki.jpg",kategori:"Outdoor"},
  {id:10,nama:"Lampu Tenda",harga:5000,gambar:"lampu-tenda.jpg",kategori:"Camping",badge:"🆕 Baru"},
  {id:11,nama:"Jaket Outdoor",harga:20000,gambar:"jaket.jpg",kategori:"Outdoor"},
  {id:12,nama:"Sepatu Outdoor",harga:25000,gambar:"sepatu.jpg",kategori:"Outdoor",badge:"⭐ Favorit"},
  {id:13,nama:"Gas Portable",harga:10000,gambar:"gas.jpg",kategori:"Cooking",beliSekali:true,badge:"🛒 Dijual"},
  {id:14,nama:"Kompor Portable",harga:10000,gambar:"kompor.jpg",kategori:"Cooking",badge:"🔥 Populer"},
  {id:15,nama:"Kompor BBQ",harga:20000,gambar:"bbq.jpg",kategori:"Cooking"},
  {id:16,nama:"Pan/Wajan",harga:10000,gambar:"pan.jpg",kategori:"Cooking"},
  {id:17,nama:"Nesting DS200",harga:10000,gambar:"nesting-ds200.jpg",kategori:"Cooking"},
  {id:18,nama:"Nesting DS500",harga:15000,gambar:"nesting-ds500.jpg",kategori:"Cooking"},
  {id:19,nama:"Cooking 1 Set",harga:25000,gambar:"cooking-set.jpg",kategori:"Cooking",badge:"🔥 Populer"},
  {id:20,nama:"Tracking Pole",harga:10000,gambar:"tracking-pole.jpg",kategori:"Outdoor"},
  {id:21,nama:"Kursi Lipat",harga:10000,gambar:"kursi.jpg",kategori:"Camping",badge:"🆕 Baru"},
  {id:22,nama:"Meja Lipat",harga:10000,gambar:"meja.jpg",kategori:"Camping"},
  {id:23,nama:"Bantal Angin",harga:6000,gambar:"bantal.jpg",kategori:"Camping"}
];

let keranjang = loadJSON("sudutCart", []);
let favorit = loadJSON("sudutFavorit", []);
let kategoriAktif = "Semua";
let pencarianAktif = "";
let toastTimer;

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function saveState() {
  localStorage.setItem("sudutCart", JSON.stringify(keranjang));
  localStorage.setItem("sudutFavorit", JSON.stringify(favorit));
}

function rupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style:"currency", currency:"IDR", maximumFractionDigits:0
  }).format(angka || 0);
}

function formatDateInput(date) {
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function formatDateIndonesia(value) {
  if (!value) return "-";
  const date=new Date(value+"T00:00:00");
  return date.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
}

function getDurasi() {
  const mulai=document.getElementById("mulai")?.value;
  const kembali=document.getElementById("kembali")?.value;
  if (!mulai || !kembali || kembali < mulai) return 0;
  const a=new Date(mulai+"T00:00:00");
  const b=new Date(kembali+"T00:00:00");
  return Math.max(1, Math.round((b-a)/86400000));
}

// Tarif per 2 hari: 1–2 hari = 1x, 3–4 hari = 2x, 5–6 hari = 3x, dan seterusnya.
function faktorHargaDurasi(durasi) {
  const hari = Math.max(1, Number(durasi) || 1);
  return Math.ceil(hari / 2);
}

function itemDibeli(item) {
  return item?.beliSekali === true || String(item?.id) === "13" || /gas\s*(portable|portabel|refil)/i.test(String(item?.nama || ""));
}

function hitungHargaItem(item, durasi) {
  const tarif = itemDibeli(item) ? 1 : faktorHargaDurasi(durasi);
  return Number(item.harga || 0) * Number(item.jumlah || 0) * tarif;
}

function setMinDate() {
  const mulai=document.getElementById("mulai");
  const kembali=document.getElementById("kembali");
  if (!mulai || !kembali) return;
  const today=formatDateInput(new Date());
  mulai.min=today;
  kembali.min=today;
  if (!mulai.value) mulai.value=today;
  if (!kembali.value) {
    const d=new Date();
    d.setDate(d.getDate()+DURASI_SEWA_DEFAULT);
    kembali.value=formatDateInput(d);
  }
}

function ubahTanggalKembali() {
  const mulai=document.getElementById("mulai");
  const kembali=document.getElementById("kembali");
  if (!mulai || !kembali || !mulai.value) return;
  kembali.min=mulai.value;
  if (!kembali.value || kembali.value < mulai.value) {
    const date=new Date(mulai.value+"T00:00:00");
    date.setDate(date.getDate()+DURASI_SEWA_DEFAULT);
    kembali.value=formatDateInput(date);
  }
  renderCart();
  hitungTotal();
}

function isFavorite(id) { return favorit.includes(id); }

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorit=favorit.filter(x=>x!==id);
    tampilkanToast("Dihapus dari favorit");
  } else {
    favorit.push(id);
    tampilkanToast("Ditambahkan ke favorit ❤️");
  }
  saveState();
  renderProducts();
  updateFavoriteCount();
}

function updateFavoriteCount() {
  const el=document.getElementById("favoriteCount");
  if (el) el.textContent=favorit.length;
}

function renderProducts() {
  const container=document.getElementById("products");
  const noProduct=document.getElementById("noProduct");
  if (!container) return;

  const hasil=products.filter(product=>
    (kategoriAktif==="Semua" || product.kategori===kategoriAktif) &&
    product.nama.toLowerCase().includes(pencarianAktif.toLowerCase())
  );

  container.innerHTML="";
  if (!hasil.length) {
    if (noProduct) noProduct.style.display="block";
    return;
  }
  if (noProduct) noProduct.style.display="none";

  hasil.forEach(product=>{
    const item=keranjang.find(x=>x.id===product.id);
    const jumlah=item?.jumlah || 0;
    const fav=isFavorite(product.id);
    const card=document.createElement("article");
    card.className="product-card";
    card.innerHTML=`
      <div class="pic">
        <img src="${product.gambar}" alt="${product.nama}" loading="lazy" decoding="async" onerror="this.src='Logo baru.png'">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <button class="favorite-btn ${fav ? "is-favorite" : ""}" onclick="toggleFavorite(${product.id})" aria-label="Favorit">
          ${fav ? "♥" : "♡"}
        </button>
      </div>
      <div class="product-info">
        <small class="product-category">${product.kategori}</small>
        <h3>${product.nama}</h3>
        <div class="product-price">${rupiah(product.harga)} <span>${product.beliSekali ? "/ pcs (beli)" : "/ hari sewa"}</span></div>
        <div class="product-actions">
          <div class="qty">
            <button onclick="ubahJumlah(${product.id},-1)" aria-label="Kurangi">−</button>
            <span>${jumlah}</span>
            <button onclick="ubahJumlah(${product.id},1)" aria-label="Tambah">+</button>
          </div>
          <button class="add-button" onclick="ubahJumlah(${product.id},1)">Tambah</button>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function ubahJumlah(id, delta) {
  const product=products.find(p=>p.id===id);
  if (!product) return;
  let item=keranjang.find(x=>x.id===id);
  if (!item && delta>0) {
    keranjang.push({id:product.id,nama:product.nama,harga:product.harga,jumlah:1,beliSekali:!!product.beliSekali});
    tampilkanToast(`${product.nama} ditambahkan ke booking`);
  } else if (item) {
    item.jumlah+=delta;
    if (item.jumlah<=0) {
      keranjang=keranjang.filter(x=>x.id!==id);
      tampilkanToast(`${product.nama} dihapus dari booking`);
    } else if (delta>0) {
      tampilkanToast(`${product.nama} ditambahkan`);
    }
  }
  saveState();
  renderProducts();
  renderCart();
  hitungTotal();
  updateCartCount();
}

function renderCart() {
  const cart=document.getElementById("cart");
  if (!cart) return;
  const durasi=getDurasi() || 1;
  if (!keranjang.length) {
    cart.innerHTML='<p class="empty-cart">Belum ada alat yang dipilih.</p>';
    updateDurationInfo(durasi);
    return;
  }
  cart.innerHTML="";
  keranjang.forEach(item=>{
    const div=document.createElement("div");
    div.className="cart-item";
    div.innerHTML=`<div><strong>${item.nama}</strong><small>${item.jumlah} × ${rupiah(item.harga)} (${itemDibeli(item) ? "harga beli satu kali" : "tarif sewa 1–2 hari"})</small></div><strong>${rupiah(hitungHargaItem(item,durasi))}</strong>`;
    cart.appendChild(div);
  });
  updateDurationInfo(durasi);
}

function updateDurationInfo(durasi=getDurasi()||1) {
  const el=document.getElementById("durationInfo");
  if (el) el.textContent=`Durasi sewa: ${durasi} hari`;
}

function hitungSubtotal(durasi=getDurasi() || 1) {
  return keranjang.reduce((sum,item)=>sum+hitungHargaItem(item,durasi),0);
}

function hitungDenda(subtotal, durasi) {
  // Denda keterlambatan tidak otomatis dikenakan berdasarkan durasi booking.
  // Perlu dicatat berdasarkan keterlambatan pengembalian yang benar-benar terjadi.
  return 0;
}

function hitungTotal() {
  const durasi=getDurasi() || 1;
  const subtotal=hitungSubtotal(durasi);
  const denda=hitungDenda(subtotal,durasi);
  const total=subtotal+denda;
  const element=document.getElementById("total");
  if (element) element.textContent=rupiah(total);
  let fee=document.getElementById("lateFeeInfo");
  if (!fee && element) {
    fee=document.createElement("small");
    fee.id="lateFeeInfo";
    fee.className="booking-note";
    element.parentElement.insertAdjacentElement("afterend",fee);
  }
  if (fee) fee.textContent="Denda keterlambatan 10% dikenakan jika alat benar-benar terlambat dikembalikan; tidak otomatis berdasarkan durasi sewa.";
  updateDurationInfo(durasi);
  return total;
}

function updateCartCount() {
  const count=keranjang.reduce((sum,item)=>sum+item.jumlah,0);
  document.querySelectorAll(".cart-count").forEach(el=>el.textContent=count);
}

function validasiWA(nomor) {
  let value=String(nomor||"").replace(/\D/g,"");
  if (value.startsWith("0")) value="62"+value.substring(1);
  return value.startsWith("62") && value.length>=10 ? value : null;
}

function buatPesanWhatsApp(data, nomorBooking) {
  const items=data.items.map(item=>`• ${item.nama} x${item.jumlah} (${itemDibeli(item) ? "BELI" : "SEWA"}) = ${rupiah(hitungHargaItem(item,data.durasi))}`).join("\n");
  return `Halo Sudut Camp 👋\n\nSaya ingin konfirmasi booking.\n\nNomor Booking: ${nomorBooking}\nNama: ${data.nama}\nTanggal: ${formatDateIndonesia(data.mulai)} s/d ${formatDateIndonesia(data.kembali)}\nJam pengembalian: ${data.waktuKembali || "18:00"}\nArea: ${data.area || "-"}\nDurasi: ${data.durasi} hari\n\nPerlengkapan:\n${items}\nSubtotal barang/sewa: ${rupiah(data.subtotal)}\nDenda keterlambatan 10%: ${rupiah(data.denda)}\nTotal: ${rupiah(data.total)}\n\nTerima kasih.`;
}

function tampilkanHasil(data, nomorBooking) {
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  set("resultNo",nomorBooking);
  set("resultNama",data.nama);
  set("resultTanggal",`${formatDateIndonesia(data.mulai)} - ${formatDateIndonesia(data.kembali)}`);
  set("resultItems",data.items.map(item=>`${item.nama} x${item.jumlah}`).join(", "));
  set("resultTotal",`${rupiah(data.total)} (termasuk denda ${rupiah(data.denda)})`);
  const wa=document.getElementById("waButton");
  if (wa) wa.href=`https://wa.me/${NOMOR_WA_RENTAL}?text=${encodeURIComponent(buatPesanWhatsApp(data,nomorBooking))}`;
  const result=document.getElementById("result");
  if (result) result.style.display="block";
}


// Reset form booking dan keranjang tanpa menghapus daftar favorit.
function resetBookingForm() {
  if (!window.confirm("Reset data booking dan kosongkan keranjang?")) return;
  ["nama", "wa", "mulai", "kembali", "trackNo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const waktu = document.getElementById("waktuKembali");
  if (waktu) waktu.value = "18:00";
  const area = document.getElementById("areaSewa");
  if (area) area.value = "Puncak Tombo";
  keranjang = [];
  saveState();
  renderCart();
  hitungTotal();
  updateCartCount();
  const result = document.getElementById("result");
  if (result) result.style.display = "none";
  const trackResult = document.getElementById("trackResult");
  if (trackResult) trackResult.textContent = "";
  const bookingButton = document.getElementById("bookingButton");
  if (bookingButton) { bookingButton.disabled = false; bookingButton.textContent = "Booking Sekarang"; }
  tampilkanToast("Form booking dan keranjang berhasil direset");
}

async function booking() {
  const nama=document.getElementById("nama")?.value.trim();
  const wa=document.getElementById("wa")?.value.trim();
  const mulai=document.getElementById("mulai")?.value;
  const kembali=document.getElementById("kembali")?.value;
  const waktuKembali=document.getElementById("waktuKembali")?.value || "18:00";
  const nomorWA=validasiWA(wa);
  const durasi=getDurasi();

  if (!nama) return tampilkanToast("Nama belum diisi");
  if (!nomorWA) return tampilkanToast("Nomor WhatsApp tidak valid");
  if (!mulai || !kembali) return tampilkanToast("Tanggal sewa belum lengkap");
  if (kembali<mulai) return tampilkanToast("Tanggal kembali tidak valid");
  if (!durasi) return tampilkanToast("Durasi sewa tidak valid");
  if (!keranjang.length) return tampilkanToast("Pilih alat terlebih dahulu");

  const subtotal=hitungSubtotal(durasi);
  const denda=hitungDenda(subtotal,durasi);
  const total=subtotal+denda;
  const area=document.getElementById("areaSewa")?.value || "Puncak Tombo";
  const adaTendaBongkar=keranjang.some(item => String(item.nama || "").toLowerCase().includes("tenda bongkar pasang"));
  if (adaTendaBongkar && area !== "Puncak Tombo") return tampilkanToast("Tenda Bongkar Pasang hanya tersedia di area Puncak Tombo.");
  const data={nama,wa:nomorWA,mulai,kembali,waktuKembali,durasi,area,items:keranjang,subtotal,denda,total};
  const button=document.getElementById("bookingButton");
  if (button) { button.disabled=true; button.textContent="⏳ Mengirim..."; }

  try {
    const response=await fetch(GOOGLE_SCRIPT_URL,{method:"POST",mode:"cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
    const hasil=await response.json();
    if (!hasil.success) throw new Error(hasil.error || hasil.message || "Booking gagal");
    tampilkanHasil(data,hasil.nomorBooking);
    tampilkanToast("Booking berhasil disimpan");
  } catch(error) {
    console.error(error);
    tampilkanToast("Booking gagal. Coba lagi atau hubungi WhatsApp.");
  } finally {
    if (button) { button.disabled=false; button.textContent="Booking Sekarang"; }
  }
}

function tampilkanToast(pesan) {
  const toast=document.getElementById("toast");
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent="✅ "+pesan;
  toast.classList.add("show");
  toastTimer=setTimeout(()=>toast.classList.remove("show"),2500);
}

function initDarkMode() {
  let btn=document.getElementById("darkModeBtn");
  if (!btn) {
    btn=document.createElement("button");
    btn.id="darkModeBtn";
    btn.className="dark-mode-btn";
    btn.setAttribute("aria-label","Ganti tema");
    btn.textContent="🌙";
    document.body.appendChild(btn);
  }
  const dark=localStorage.getItem("sudutTheme")==="dark";
  document.body.classList.toggle("dark-mode",dark);
  btn.textContent=dark?"☀️":"🌙";
  btn.onclick=()=>{
    const active=document.body.classList.toggle("dark-mode");
    localStorage.setItem("sudutTheme",active?"dark":"light");
    btn.textContent=active?"☀️":"🌙";
  };
}

function initMobileMenu() {
  const toggle=document.getElementById("menuToggle");
  const nav=document.getElementById("navMenu");
  if (!toggle || !nav) return;
  toggle.onclick=()=>{
    nav.classList.toggle("active");
    toggle.textContent=nav.classList.contains("active")?"✕":"☰";
  };
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
    nav.classList.remove("active"); toggle.textContent="☰";
  }));
}

function injectBottomNav() {
  if (document.querySelector(".mobile-bottom-nav")) return;
  const nav=document.createElement("nav");
  nav.className="mobile-bottom-nav";
  nav.innerHTML=`
    <a href="index.html">🏠<span>Beranda</span></a>
    <a href="index.html#alat">🏕️<span>Alat</span></a>
    <a href="booking.html" class="bottom-booking">🛒<b class="cart-count">0</b><span>Booking</span></a>
    <a href="lokasi.html">📍<span>Lokasi</span></a>`;
  document.body.appendChild(nav);
  updateCartCount();
}

function injectWhatsApp() {
  if (document.querySelector(".wa-floating")) return;
  const a=document.createElement("a");
  a.href=`https://wa.me/${NOMOR_WA_RENTAL}`;
  a.target="_blank";
  a.className="wa-floating";
  a.setAttribute("aria-label","Chat WhatsApp");
  a.innerHTML='<span>💬</span><div><strong>Chat Kami</strong><small>WhatsApp</small></div>';
  document.body.appendChild(a);
}

function initSearchAndCategories() {
  const search=document.getElementById("searchProduct");
  if (search) search.addEventListener("input",e=>{pencarianAktif=e.target.value.trim();renderProducts();});
  document.querySelectorAll(".category-btn").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll(".category-btn").forEach(b=>b.classList.remove("active"));
    button.classList.add("active");
    kategoriAktif=button.dataset.category || "Semua";
    renderProducts();
  }));
}

function initBookingDates() {
  const mulai=document.getElementById("mulai");
  const kembali=document.getElementById("kembali");
  if (mulai) mulai.addEventListener("change",ubahTanggalKembali);
  if (kembali) kembali.addEventListener("change",()=>{if(mulai?.value && kembali.value<mulai.value) kembali.value=mulai.value;renderCart();hitungTotal();});
}

function initMap() {
  const btn=document.getElementById("loadMapBtn");
  const box=document.getElementById("mapContainer");
  if (!btn || !box) return;
  btn.onclick=()=>{
    if (box.dataset.loaded) return;
    const iframe=document.createElement("iframe");
    iframe.src="https://www.google.com/maps?q=RT.09%2FRW.03%2C%20Tombo%2C%20Kec.%20Bandar%2C%20Kabupaten%20Batang%2C%20Jawa%20Tengah%2051254&output=embed";
    iframe.loading="lazy";
    iframe.allowFullscreen=true;
    iframe.referrerPolicy="no-referrer-when-downgrade";
    box.innerHTML="";
    box.appendChild(iframe);
    box.dataset.loaded="1";
    btn.textContent="✅ Peta ditampilkan";
  };
}

function initPackingChecklist() {
  const container = document.getElementById("packingChecklist");
  if (!container) return;
  const checks = [...container.querySelectorAll('input[type="checkbox"]')];
  const saved = loadJSON("sudutPackingChecklist", []);
  checks.forEach(input => {
    input.checked = saved.includes(input.value);
    input.addEventListener("change", updatePackingChecklist);
  });
  document.getElementById("packingReset")?.addEventListener("click", () => {
    checks.forEach(input => input.checked = false);
    updatePackingChecklist();
    tampilkanToast("Checklist camping diulang");
  });
  function updatePackingChecklist() {
    const done = checks.filter(input => input.checked).map(input => input.value);
    localStorage.setItem("sudutPackingChecklist", JSON.stringify(done));
    const text = document.getElementById("packingProgressText");
    const bar = document.getElementById("packingProgressBar");
    if (text) text.textContent = `${done.length} dari ${checks.length} siap`;
    if (bar) bar.style.width = `${checks.length ? done.length / checks.length * 100 : 0}%`;
  }
  updatePackingChecklist();
}

function pilihPaket(namaPaket) {
  const paket = {
    hemat: [{id:1,jumlah:1},{id:6,jumlah:1},{id:7,jumlah:1},{id:10,jumlah:1}],
    berdua: [{id:1,jumlah:1},{id:6,jumlah:2},{id:7,jumlah:2},{id:10,jumlah:1}],
    masak: [{id:14,jumlah:1},{id:19,jumlah:1},{id:17,jumlah:1},{id:16,jumlah:1}]
  };
  const selected=paket[namaPaket]; if(!selected)return;
  selected.forEach(choice=>{const p=products.find(x=>x.id===choice.id);if(!p)return;const existing=keranjang.find(x=>x.id===p.id);if(existing)existing.jumlah+=choice.jumlah;else keranjang.push({id:p.id,nama:p.nama,harga:p.harga,jumlah:choice.jumlah,beliSekali:!!p.beliSekali});});
  saveState();renderProducts();renderCart();hitungTotal();updateCartCount();
  tampilkanToast("Paket ditambahkan. Kamu bisa menyesuaikan jumlah barang di keranjang.");
  const bookingArea=document.getElementById("booking")||document.getElementById("lacakBooking");
  if(bookingArea)bookingArea.scrollIntoView({behavior:"smooth",block:"start"});
}

function init() {
  initDarkMode();
  initMobileMenu();
  injectBottomNav();
  injectWhatsApp();
  initSearchAndCategories();
  initBookingDates();
  initMap();
  initPackingChecklist();
  setMinDate();
  renderProducts();
  renderCart();
  hitungTotal();
  updateCartCount();
  updateFavoriteCount();
  const loading=document.getElementById("loadingScreen");
  if (loading) setTimeout(()=>loading.classList.add("hide"),250);
}

document.addEventListener("DOMContentLoaded",init);

/* =========================
   LOADING ANIMATION
   ========================= */

const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");
const loadingIcon = document.getElementById("loadingIcon");

const loadingItems = [
  {
    icon:"🏕️",
    text:"Menyiapkan petualanganmu..."
  },
  {
    icon:"⛺",
    text:"Memuat perlengkapan camping..."
  },
  {
    icon:"🥾",
    text:"Menyiapkan perlengkapan outdoor..."
  },
  {
    icon:"🔥",
    text:"Menyiapkan peralatan camping..."
  },
  {
    icon:"🎒",
    text:"Menyiapkan perlengkapan perjalanan..."
  },
  {
    icon:"✨",
    text:"Hampir selesai..."
  }
];

let loadingIndex = 0;

function gantiLoading(){
  if(!loadingMessage || !loadingIcon) return;

  loadingIndex++;

  if(loadingIndex >= loadingItems.length){
    loadingIndex = 0;
  }

  loadingMessage.style.animation = "none";
  
  setTimeout(()=>{
    loadingIcon.textContent = loadingItems[loadingIndex].icon;
    loadingMessage.textContent = loadingItems[loadingIndex].text;
    loadingMessage.style.animation = "loadingText .5s ease";
  },50);
}

const loadingInterval = setInterval(gantiLoading,700);

window.addEventListener("load",()=>{
  setTimeout(()=>{
    clearInterval(loadingInterval);

    if(loadingScreen){
      loadingScreen.classList.add("hide");
    }
  },1800);
});

// Kalkulator denda keterlambatan: denda 10% dari harga asli barang yang terlambat,
// hanya jika keterlambatan mencapai 12 jam. Denda dihitung sekali saja.
function hitungKalkulatorDenda() {
  const harga = Math.max(0, Number(document.getElementById("dendaHarga")?.value) || 0);
  const jumlah = Math.max(1, Number(document.getElementById("dendaJumlah")?.value) || 1);
  const jam = Math.max(0, Number(document.getElementById("dendaJam")?.value) || 0);
  const hasil = document.getElementById("dendaHasil");
  const keterangan = document.getElementById("dendaKeterangan");
  if (!hasil || !keterangan) return;
  const jenis = document.getElementById("dendaJenis")?.value || "normal";
  const denda = jenis === "bongkar" ? 0 : (jam >= 12 ? Math.round(harga * jumlah * 0.10) : 0);
  hasil.textContent = rupiah(denda);
  keterangan.textContent = jenis === "bongkar"
    ? "Tenda Bongkar Pasang khusus area Puncak Tombo: bebas denda keterlambatan."
    : (jam >= 12 ? "Keterlambatan 12 jam atau lebih: denda 10% dari harga asli barang yang terlambat (sekali saja)." : "Belum ada denda. Denda mulai berlaku jika terlambat minimal 12 jam.");
}
document.addEventListener("DOMContentLoaded", () => {
  ["dendaHarga", "dendaJumlah", "dendaJam", "dendaJenis"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", hitungKalkulatorDenda);
  });
  hitungKalkulatorDenda();
});
