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

Browser tidak mengizinkan aplikasi web mendeteksi nama/status printer. Printer dan jumlah salinan dipilih melalui dialog cetak sistem Windows. Ini adalah batas keamanan browser, bukan keterbatasan koneksi internet.

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
