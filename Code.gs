// SUDUT CAMP RENTAL: API booking lama + admin panel.
// Backup Code.gs lama sebelum mengganti isi file ini.
const SHEET_NAME = "Booking";
const PRODUCT_SHEET_NAME = "Produk";
const TIMEZONE = "Asia/Jakarta";
const HEADERS = ["No Booking","Waktu Booking","Nama","WhatsApp","Tanggal Mulai","Tanggal Kembali","Durasi","Total","Dana masuk","Status","Area","Items JSON","Jam Kembali Dijanjikan","Waktu Kembali Aktual","Jam Terlambat","Denda","Catatan"];
const PRODUCT_HEADERS = ["ID","Nama","Kategori","Harga","Stok","Gambar","Aktif"];

function doGet(){ return out({success:true,message:"Sudut Camp Rental API aktif"}); }

function doPost(e){
  try{
    if(!e || !e.postData || !e.postData.contents) throw new Error("Data tidak ditemukan.");
    const d=JSON.parse(e.postData.contents);
    if(d.action) return adminAction_(d);
    return saveBooking_(d); // kompatibel dengan booking website lama
  }catch(err){return out({success:false,error:err.message||"Terjadi kesalahan."});}
}

function saveBooking_(d){
  if(!d.nama||!d.wa||!d.mulai||!d.kembali||!d.items||!d.items.length) throw new Error("Data booking belum lengkap.");
  const s=bookingSheet_(), now=new Date();
  const no="SCR-"+Utilities.formatDate(now,TIMEZONE,"yyyyMMdd-HHmmss");
  s.appendRow([no,Utilities.formatDate(now,TIMEZONE,"dd/MM/yyyy HH:mm:ss"),String(d.nama),String(d.wa),String(d.mulai),String(d.kembali),Math.max(1,Number(d.durasi)||1)+" hari",Math.max(0,Number(d.total)||0),"","Menunggu",String(d.area||"Puncak Tombo"),JSON.stringify(d.items||[]),String(d.waktuKembali||"18:00"),"",0,0,""]);
  s.getRange(s.getLastRow(),8,1,2).setNumberFormat('"Rp"#,##0');
  return out({success:true,nomorBooking:no,message:"Booking berhasil disimpan."});
}

function adminAction_(d){
  if(d.action==="trackBooking") return out(trackBooking_(d.no));
  if(d.action==="adminLogin"){verifyPassword_(d.password);return out({success:true,message:"Login berhasil."});}
  verifyPassword_(d.password);
  switch(d.action){
    case "adminList": return out({success:true,bookings:listBookings_(),products:listProducts_(),report:report_()});
    case "resetBookings": return out(resetBookings_());
    case "adminReturn": return out(processReturn_(d));
    case "checkAvailability": return out(checkAvailability_(d));
    case "adminSetStatus": return out(setStatus_(d));
    case "productSave": return out(saveProduct_(d.product||{}));
    case "productDelete": return out(deleteProduct_(d.id));
    case "productStock": return out(stockProduct_(d.id,d.stok));
    default: throw new Error("Aksi admin tidak dikenal.");
  }
}
function verifyPassword_(pw){
  const expected=PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if(!expected) throw new Error("ADMIN_PASSWORD belum diatur di Script Properties.");
  if(!pw||String(pw)!==expected) throw new Error("Password admin salah.");
}
function bookingSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName(SHEET_NAME);
  if(!s)s=ss.insertSheet(SHEET_NAME);
  const last=s.getLastColumn();
  if(last>0&&s.getLastRow()>0){
    const old=s.getRange(1,1,1,last).getValues()[0];
    for(let i=old.length-1;i>=0;i--)if(String(old[i]).trim().toLowerCase()==="alat")s.deleteColumn(i+1);
  }
  if(s.getMaxColumns()<HEADERS.length)s.insertColumnsAfter(s.getMaxColumns(),HEADERS.length-s.getMaxColumns());
  s.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold");s.setFrozenRows(1);
  return s;
}

function resetBookings_(){
  const s=bookingSheet_();
  const last=s.getLastRow();
  if(last>1) s.deleteRows(2,last-1);
  return {success:true,message:"Semua data booking berhasil dihapus. Daftar produk dan stok tetap aman."};
}

function listBookings_(){
  const s=bookingSheet_(),n=s.getLastRow();if(n<2)return [];
  return s.getRange(2,1,n-1,HEADERS.length).getDisplayValues().map((r,i)=>({row:i+2,no:r[0],waktu:r[1],nama:r[2],wa:r[3],mulai:r[4],kembali:r[5],durasi:r[6],total:num_(r[7]),masuk:num_(r[8]),status:r[9]||"Menunggu",area:r[10]||"Puncak Tombo",itemsJson:r[11]||"[]",waktuKembali:r[12]||"18:00",aktual:r[13]||"",jamTerlambat:num_(r[14]),denda:num_(r[15]),catatan:r[16]||""})).reverse();
}
function setStatus_(d){
  const allowed=["Menunggu","Dikonfirmasi","Selesai","Dibatalkan"];
  if(!d.no||!allowed.includes(String(d.status)))throw new Error("Nomor booking atau status tidak valid.");
  const s=bookingSheet_(),n=s.getLastRow();if(n<2)throw new Error("Booking belum ada.");
  const ids=s.getRange(2,1,n-1,1).getDisplayValues().flat(),i=ids.findIndex(x=>x===String(d.no));
  if(i<0)throw new Error("Nomor booking tidak ditemukan.");
  s.getRange(i+2,10).setValue(d.status);
  if(d.masuk!==undefined&&d.masuk!=="")s.getRange(i+2,9).setValue(Math.max(0,Number(d.masuk)||0)).setNumberFormat('"Rp"#,##0');
  return {success:true,message:"Status booking diperbarui."};
}
function productSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName(PRODUCT_SHEET_NAME);
  if(!s)s=ss.insertSheet(PRODUCT_SHEET_NAME);
  s.getRange(1,1,1,PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]).setFontWeight("bold");s.setFrozenRows(1);return s;
}
function listProducts_(){
  const s=productSheet_(),n=s.getLastRow();if(n<2)return [];
  return s.getRange(2,1,n-1,7).getDisplayValues().map(r=>({id:r[0],nama:r[1],kategori:r[2],harga:num_(r[3]),stok:num_(r[4]),gambar:r[5],aktif:r[6]||"Ya"}));
}
function saveProduct_(p){
  if(!String(p.nama||"").trim())throw new Error("Nama produk wajib diisi.");
  const s=productSheet_(),id=String(p.id||Utilities.getUuid());
  const row=[id,String(p.nama).trim(),String(p.kategori||"Outdoor"),Math.max(0,Number(p.harga)||0),Math.max(0,Number(p.stok)||0),String(p.gambar||""),p.aktif==="Tidak"?"Tidak":"Ya"];
  const n=s.getLastRow();let target=0;
  if(n>=2){const ids=s.getRange(2,1,n-1,1).getDisplayValues().flat(),i=ids.findIndex(x=>x===id);if(i>=0)target=i+2;}
  if(target)s.getRange(target,1,1,7).setValues([row]);else{s.appendRow(row);target=s.getLastRow();}
  s.getRange(target,4).setNumberFormat('"Rp"#,##0');return {success:true,message:"Produk tersimpan.",id:id};
}
function deleteProduct_(id){
  if(!id)throw new Error("ID produk tidak ada.");const s=productSheet_(),n=s.getLastRow();if(n<2)throw new Error("Produk belum ada.");
  const ids=s.getRange(2,1,n-1,1).getDisplayValues().flat(),i=ids.findIndex(x=>x===String(id));if(i<0)throw new Error("Produk tidak ditemukan.");
  s.deleteRow(i+2);return {success:true,message:"Produk dihapus."};
}
function stockProduct_(id,stock){
  const s=productSheet_(),n=s.getLastRow();if(n<2)throw new Error("Produk belum ada.");
  const ids=s.getRange(2,1,n-1,1).getDisplayValues().flat(),i=ids.findIndex(x=>x===String(id));if(i<0)throw new Error("Produk tidak ditemukan.");
  s.getRange(i+2,5).setValue(Math.max(0,Number(stock)||0));return {success:true,message:"Stok diperbarui."};
}
function trackBooking_(no){
  if(!no)throw new Error("Masukkan nomor booking.");
  const s=bookingSheet_(),n=s.getLastRow();if(n<2)throw new Error("Booking belum ditemukan.");
  const rows=s.getRange(2,1,n-1,HEADERS.length).getDisplayValues();
  const r=rows.find(x=>x[0]===String(no).trim());if(!r)throw new Error("Nomor booking tidak ditemukan.");
  return {success:true,booking:{no:r[0],nama:r[2],mulai:r[4],kembali:r[5],durasi:r[6],total:num_(r[7]),status:r[9]||"Menunggu",area:r[10]||"Puncak Tombo"}};
}
function checkAvailability_(d){
  const mulai=String(d.mulai||""),kembali=String(d.kembali||"");
  if(!mulai||!kembali)return {available:false,message:"Tanggal sewa belum lengkap."};
  const requested=Array.isArray(d.items)?d.items:[];
  const sheet=bookingSheet_(),n=sheet.getLastRow();
  if(n<2)return {available:true,message:"Barang tersedia."};
  const rows=sheet.getRange(2,1,n-1,HEADERS.length).getDisplayValues();
  const conflicts=[];
  requested.forEach(item=>{
    const wanted=Number(item.jumlah)||1; let reserved=0;
    rows.forEach(r=>{
      const status=r[9]||"Menunggu";
      if(status==="Dibatalkan"||r[4]>kembali||r[5]<mulai)return;
      let items=[];try{items=JSON.parse(r[11]||"[]");}catch(e){}
      items.forEach(old=>{if(String(old.id)===String(item.id))reserved+=Number(old.jumlah)||0;});
    });
    // Catalog stock is not yet centrally configured; guard against duplicate bookings conservatively.
    if(reserved>=wanted)conflicts.push(item.nama||"Barang");
  });
  return conflicts.length?{available:false,message:"Kemungkinan bentrok booking untuk: "+[...new Set(conflicts)].join(", ")+". Hubungi admin untuk memastikan stok."}:{available:true,message:"Tidak ditemukan booking bentrok pada data yang tersimpan."};
}
function isPurchaseItem_(item){
  return String(item && item.id) === "13" || /gas\s*(portable|portabel|refil)/i.test(String(item && item.nama || "")) || item && item.beliSekali === true;
}
function processReturn_(d){
  if(!d.no)throw new Error("Nomor booking wajib diisi.");
  const s=bookingSheet_(),n=s.getLastRow();if(n<2)throw new Error("Booking belum ada.");
  const ids=s.getRange(2,1,n-1,1).getDisplayValues().flat(),idx=ids.findIndex(x=>x===String(d.no));if(idx<0)throw new Error("Nomor booking tidak ditemukan.");
  const row=idx+2,values=s.getRange(row,1,1,HEADERS.length).getValues()[0];
  const planned=new Date(String(values[5])+"T"+String(values[12]||"18:00")+":00+07:00");
  const actualText=String(d.aktual||"");const actual=new Date(actualText.length===16?actualText+":00+07:00":actualText);if(isNaN(actual.getTime()))throw new Error("Waktu pengembalian aktual tidak valid.");
  const hours=Math.max(0,Math.floor((actual.getTime()-planned.getTime())/3600000));
  let items=[];try{items=JSON.parse(values[11]||"[]");}catch(e){}
  const lateItems=Array.isArray(d.lateItems)?d.lateItems.map(String):items.filter(x=>!String(x.nama||"").toLowerCase().includes("tenda bongkar pasang")&&!isPurchaseItem_(x)).map(x=>String(x.id));
  let fine=0;
  if(hours>=12){items.forEach(item=>{const exempt=String(item.nama||"").toLowerCase().includes("tenda bongkar pasang")||isPurchaseItem_(item);if(!exempt&&lateItems.includes(String(item.id)))fine+=Math.round((Number(item.harga)||0)*(Number(item.jumlah)||1)*0.10);});}
  s.getRange(row,14).setValue(actual);s.getRange(row,15).setValue(hours);s.getRange(row,16).setValue(fine).setNumberFormat('"Rp"#,##0');s.getRange(row,17).setValue(String(d.catatan||""));
  return {success:true,message:"Pengembalian dicatat.",jamTerlambat:hours,denda:fine};
}
function report_(){
  const b=listBookings_(),p=listProducts_(),valid=b.filter(x=>x.status!=="Dibatalkan");
  return {jumlahBooking:b.length,menunggu:b.filter(x=>x.status==="Menunggu").length,dikonfirmasi:b.filter(x=>x.status==="Dikonfirmasi").length,selesai:b.filter(x=>x.status==="Selesai").length,totalTransaksi:valid.reduce((a,x)=>a+x.total,0),totalMasuk:b.reduce((a,x)=>a+x.masuk,0),jumlahProduk:p.length,stokMenipis:p.filter(x=>x.stok<=2&&x.aktif!=="Tidak").length};
}
function num_(v){return Number(String(v||"").replace(/[^\d.-]/g,""))||0;}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
