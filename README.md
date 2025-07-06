# Perencana Perbaikan Strategis (PPS) Berbasis AI

![Screenshot Aplikasi](https://placehold.co/800x400/1e293b/67e8f9?text=Tampilan+Aplikasi+PPS-AI)

## 🚀 Tentang Proyek

Aplikasi ini adalah alat bantu berbasis web yang dirancang untuk membantu institusi (seperti Puskesmas, klinik, atau lembaga pendidikan) dalam menyusun **Rencana Perbaikan Strategis (PPS)** untuk keperluan akreditasi. Dengan memanfaatkan kekuatan AI generatif dari Google (model Gemini), aplikasi ini dapat secara otomatis menghasilkan ide untuk:

-   **Rencana Tindak Lanjut (RTL)**
-   **Indikator Pencapaian**
-   **Sasaran Kinerja**
-   **Judul Dokumen Bukti Implementasi**

Tujuannya adalah untuk mempercepat proses perencanaan, memastikan setiap elemen penilaian ditangani, dan menghasilkan daftar dokumen yang terorganisir untuk persiapan akreditasi.

## ✨ Fitur Utama

-   **Unggah File Excel**: Cukup unggah file Excel (.xlsx) yang berisi data elemen penilaian dan rekomendasi awal.
-   **Generasi Konten dengan AI**: Klik tombol untuk meminta AI membuatkan Rencana Perbaikan, Indikator, Sasaran, dan Keterangan (bukti dokumen) untuk setiap item.
-   **Aksi Massal**: Jalankan pembuatan konten untuk semua item sekaligus untuk efisiensi maksimal.
-   **Penyimpanan Cloud**: Progres Anda disimpan secara otomatis menggunakan Firebase Firestore, sehingga Anda bisa melanjutkan pekerjaan kapan saja.
-   **Inventaris Dokumen**: Secara otomatis membuat daftar semua dokumen bukti yang perlu disiapkan.
-   **Pengelompokan Dokumen**: Mengelompokkan dokumen berdasarkan tipenya (misalnya, SK, SOP, Laporan) untuk kemudahan manajemen.
-   **Ringkasan Strategis AI**: Dapatkan analisis dan saran pengelompokan kegiatan dari AI untuk melihat gambaran besar dari rencana perbaikan Anda.
-   **Ekspor Data**: Unduh semua hasil kerja Anda dalam format Excel (.xlsx), CSV, Teks, atau Word (.doc).

## 🛠️ Teknologi yang Digunakan

-   **Frontend**: React.js (dengan JSX ditranspilasi di browser oleh Babel)
-   **Styling**: Tailwind CSS
-   **Ikon**: Lucide Icons
-   **Pemrosesan Excel**: SheetJS (XLSX)
-   **AI**: Google Gemini API
-   **Database**: Google Firebase (Firestore) untuk persistensi data.

## ⚙️ Cara Menjalankan

Proyek ini dirancang untuk berjalan langsung di browser tanpa perlu proses *build*.

1.  **Dapatkan Kunci API Google AI**:
    1.  Buka [Google AI Studio](https://aistudio.google.com/app/apikey).
    2.  Masuk dengan akun Google Anda.
    3.  Klik **"Create API key"** untuk membuat kunci baru.
    4.  Salin kunci API tersebut.

2.  **Buka Aplikasi**:
    -   Jika Anda menjalankan secara lokal, cukup buka file `index.html` di browser Anda.
    -   Jika di-hosting di GitHub Pages, buka URL yang disediakan.

3.  **Gunakan Aplikasi**:
    1.  Tempel (paste) Kunci API Google AI Anda ke kolom yang tersedia.
    2.  Unggah file Excel Anda yang berisi data akreditasi. Anda bisa mengunduh template yang disediakan jika belum punya.
    3.  Gunakan tombol-tombol AI untuk mengisi kolom-kolom yang kosong.
    4.  Lihat hasil inventaris dan pengelompokan dokumen.
    5.  Unduh hasil akhir dalam format yang Anda inginkan.

## 📄 Struktur File

```
.
├── index.html      # File HTML utama
├── style.css       # File styling kustom
├── script.js       # Logika aplikasi (React/JavaScript)
└── README.md       # File yang sedang Anda baca ini
```

## 🤝 Kontribusi

Kontribusi, isu, dan permintaan fitur sangat kami hargai! Jangan ragu untuk membuat *pull request* atau membuka *issue* baru.

## 📜 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
