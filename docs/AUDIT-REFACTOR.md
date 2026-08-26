# Audit dan Refactor DokuFoto React

Tanggal audit: 26 Agustus 2026

## Temuan yang diperbaiki

| Prioritas | Temuan | Dampak | Perbaikan |
|---|---|---|---|
| Kritis | Foto Base64 disimpan di `localStorage` dan kegagalan kuota diabaikan | Autosave berhenti tanpa diketahui pengguna | Pindah ke IndexedDB, tambah debounce dan notifikasi kegagalan |
| Tinggi | Google Fonts, Unsplash, dan Tailwind CDN dipakai saat runtime/cetak | Aplikasi tidak benar-benar offline; hasil cetak berubah saat internet putus | Hapus seluruh dependensi runtime eksternal dan gunakan CSS/font lokal |
| Tinggi | Daftar printer adalah data contoh statis | Antarmuka memberi kesan printer benar-benar terdeteksi | Hapus daftar palsu; delegasikan pemilihan printer/copies ke dialog Windows |
| Tinggi | JSON proyek diterima tanpa validasi | Berkas rusak dapat membuat aplikasi crash | Tambah schema/version marker dan validasi struktur saat impor |
| Tinggi | ZIP dapat diekspor tetapi tidak dapat dimuat kembali | Cadangan tidak berfungsi sebagai pemulihan lengkap | Tambah impor ZIP dan rekonstruksi galeri media |
| Sedang | Crop hanya memperbarui `grids`, bukan `cells` kompatibilitas | Crop dapat hilang pada ekspor/perubahan template | Sinkronkan kedua representasi melalui satu helper |
| Sedang | “Kosongkan semua foto” hanya membersihkan `cells` | Foto pada grid aktif tetap tampil | Bersihkan `cells` dan seluruh `grids` |
| Sedang | FileReader tersebar, tanpa batas ukuran, dan batch upload tidak deterministik | File gagal dapat menggantung batch; penggunaan memori tak terkendali | Sentralisasi validasi/read, batas 30 MB, `Promise.allSettled` |
| Sedang | DOCX dan ZIP ikut masuk bundle awal | JavaScript awal terlalu besar | Gunakan dynamic import untuk modul ekspor |
| Sedang | Dependensi AI/server/UI tidak digunakan | Instalasi lebih berat dan membingungkan untuk mode offline | Hapus dependensi yang tidak dipakai |
| Rendah | Tes `.NET` merujuk project yang tidak ada | Folder tes tidak dapat dijalankan dan tidak relevan | Ganti dengan unit test TypeScript/Vitest |
| Rendah | Server dev bind ke `0.0.0.0` | Aplikasi lokal terekspos ke LAN tanpa sengaja | Default ke `127.0.0.1`; sediakan `dev:lan` eksplisit |

## Model data lokal

Proyek dan galeri foto disimpan sebagai satu `WorkspaceSnapshot` berversi. IndexedDB dipakai untuk autosave, sedangkan file JSON/ZIP menjadi cadangan portabel. Semua gambar pengguna disimpan sebagai Data URL lokal; URL gambar jaringan ditolak saat impor proyek.

## Batas platform

Web browser dapat membaca file yang dipilih pengguna dan menghasilkan download tanpa server. Browser tidak dapat mengakses daftar printer Windows secara langsung. Dialog `window.print()` adalah jalur yang aman dan didukung untuk memilih printer, ukuran, warna, serta jumlah salinan.
