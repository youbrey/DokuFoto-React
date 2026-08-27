# DokuFoto React

DokuFoto adalah aplikasi React + TypeScript untuk membuat kolase foto dan mengekspornya ke DOCX, ZIP, berkas proyek, atau printer. Seluruh pemrosesan gambar berlangsung di browser pada komputer pengguna.

## Menjalankan di Visual Studio Code

Prasyarat:

- Windows 10/11
- [Node.js 22 LTS](https://nodejs.org/) atau minimal Node.js 20.19
- Visual Studio Code

Langkah pertama (memerlukan internet untuk mengunduh dependensi):

```powershell
git clone https://github.com/youbrey/DokuFoto-React.git
cd DokuFoto-React
npm ci
npm run dev
```

Buka `http://127.0.0.1:3000`. Ini tetap merupakan localhost dan secara default tidak diekspos ke perangkat lain di jaringan. Di VS Code, perintah yang sama tersedia melalui **Terminal > Run Task**.

Untuk memeriksa dan membuat build produksi:

```powershell
npm run check
npm run preview
```

Hasil build berada di folder `dist` dan pratinjau tersedia di `http://127.0.0.1:4173`.

## Menjalankan build dengan XAMPP

XAMPP hanya dipakai sebagai server web lokal (Apache). PHP dan MySQL tidak diperlukan karena DokuFoto adalah aplikasi web statis dan seluruh pemrosesan dilakukan di browser.

1. Buka folder proyek di VS Code, lalu jalankan instalasi dependensi dan build:

   ```powershell
   npm ci
   npm run build
   ```

2. Buat folder tujuan di XAMPP dan salin **isi** folder `dist` ke sana:

   ```powershell
   New-Item -ItemType Directory -Force C:\xampp\htdocs\DokuFoto
   Copy-Item -Path .\dist\* -Destination C:\xampp\htdocs\DokuFoto -Recurse -Force
   ```

3. Buka XAMPP Control Panel dan klik **Start** pada Apache.
4. Buka `http://localhost/DokuFoto/` di browser. Jika Apache menggunakan port 8080, buka `http://localhost:8080/DokuFoto/`.

Jangan membuka `dist/index.html` dengan klik ganda (`file://`). Jalankan melalui Apache agar perilakunya konsisten. Saat kode berubah, jalankan kembali `npm run build`, lalu ganti isi folder `C:\xampp\htdocs\DokuFoto` dengan isi `dist` yang baru.

Instalasi awal `npm ci` memerlukan internet untuk mengambil paket yang belum tersedia. Setelah dependensi terpasang dan build selesai, XAMPP serta fitur impor/ekspor gambar dapat dijalankan tanpa internet.

Data autosave IndexedDB terikat pada alamat situs (origin). Data di `http://127.0.0.1:3000` tidak otomatis muncul di `http://localhost/DokuFoto/`. Sebelum berpindah alamat, ekspor proyek sebagai `.dokufoto.json` atau `.zip`, lalu impor kembali dari versi XAMPP. Aplikasi saat ini tidak memakai client-side routing, sehingga konfigurasi `.htaccess` tidak diperlukan.

## Operasi offline

Setelah `npm ci` selesai dan dependensi sudah ada di komputer, fitur utama dapat dipakai tanpa internet:

- impor JPG, PNG, dan WEBP dari file atau folder lokal;
- drag-and-drop gambar dari Windows Explorer;
- edit kolase, crop, rotasi, teks, kop surat, dan margin;
- autosave proyek dan foto ke IndexedDB milik browser;
- simpan/muat proyek `.dokufoto.json`;
- simpan/muat arsip `.zip`;
- ekspor `.docx`; dan
- download file serta membuka dialog cetak Windows.

Istilah **unggah** pada antarmuka berarti membaca file dari disk ke memori browser lokal. File tidak dikirim ke server maupun layanan internet. Istilah **unduh** berarti browser menyimpan Blob yang dibuat secara lokal ke disk.

Browser tidak mengizinkan aplikasi web XAMPP mendeteksi nama/status printer secara langsung. Tombol **Buka Dialog Printer Windows** membuat halaman cetak yang terlihat, menunggu seluruh gambar dan font selesai dimuat, lalu membuka dialog sistem. Daftar printer, status perangkat, ukuran kertas, dan jumlah salinan berasal dari Windows. Izinkan pop-up untuk `localhost` bila browser memblokir jendela cetak.

Pada dialog cetak, pilih ukuran kertas yang sama dengan proyek dan gunakan skala **100% / Actual size**. Nonaktifkan opsi **Fit**, **Shrink**, atau penyesuaian halaman lain agar Chrome/driver printer tidak menskalakan ulang gambar halaman.

Cetak dan DOCX memakai renderer WYSIWYG yang sama dengan pratinjau aplikasi. Setiap halaman diraster menjadi PNG 300 DPI, lalu gambar halaman yang identik dikirim ke jendela cetak atau ditempatkan penuh pada halaman Word. Posisi, ukuran, crop, rotasi, grid, teks, warna, dan margin karena itu tidak dibangun ulang oleh Word. Konsekuensinya, teks dan foto di dalam DOCX tidak dapat diedit sebagai elemen Word terpisah; untuk mengubah isi, edit proyek DokuFoto lalu ekspor kembali.

Fitur Judul Dokumen Baku, Tabel Informasi, dan Blok Tanda Tangan telah dihapus. Judul atau keterangan tetap dapat dibuat dengan **Teks Bebas**, sehingga posisi akhirnya ditentukan langsung pada kanvas.

## Perintah proyek

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan lokal di port 3000 |
| `npm run dev:lan` | Server pengembangan yang sengaja dibuka ke LAN |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm test` | Unit test Vitest |
| `npm run build` | Build produksi ke `dist` |
| `npm run check` | Type-check, test, dan build sekaligus |
| `npm run preview` | Pratinjau build produksi di port 4173 |

## Batas file gambar

DokuFoto menerima JPG/JPEG, PNG, dan WEBP hingga 30 MB per file. Pembatasan ini mencegah browser kehabisan memori saat banyak foto resolusi tinggi dimuat sekaligus. Proyek lokal tersimpan per-origin browser; jangan menghapus data situs `127.0.0.1:3000` sebelum membuat cadangan `.dokufoto.json` atau `.zip`.
