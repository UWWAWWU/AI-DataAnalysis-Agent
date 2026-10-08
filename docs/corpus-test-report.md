# Hasil uji AI Data Analysis Agent

Tanggal: 8 Oktober 2026 (UTC). Aplikasi: https://aiagent.wawutriambodo.my.id/

## Hasil utama

| Pengujian | Hasil |
|---|---|
| Perhitungan pada 60 dataset sintetis | 60/60 lulus |
| Perhitungan pada 20 dataset publik | 20/20 lulus |
| Pemeriksaan filter/perhitungan independen | 420 lulus: 334 sintetis + 86 publik |
| Alur AI lengkap melalui API produksi dan E2B | 12 lulus |
| Alur AI yang belum lulus | 13: 12 berhenti sebelum selesai, 1 gagal menghasilkan brief terverifikasi |
| Alur langsung yang dihentikan saat batch dibatalkan | 6, checkpoint disimpan |
| Target sintetis langsung yang belum dicoba | 19 dari target 50 |
| Audit Python Spearman buatan AI | 2/2 cocok dengan SciPy independen |
| Uji kategori melalui E2B produksi | Lulus setelah perbaikan |

**Kesimpulan:** mesin perhitungan lulus pada 80 dataset yang diperiksa. Alur AI belum terbukti andal di seluruh corpus karena kegagalan respons model dan layanan membatasi sebagian pengujian. Jangan menyebut hasil ini sebagai 80 alur AI yang sukses.

## Bug yang ditemukan dan diperbaiki

Pandas sebelumnya dapat mengubah kategori `001` menjadi angka `1`, dan label literal `NA` menjadi nilai kosong. Nilai yang dipakai filter browser lalu berbeda dari nilai Python. Loader CSV/XLSX kini mempertahankan kode berawalan nol, identifier, dan `NA`; kolom numerik yang aman tetap dikonversi. Kategori numerik nullable juga memakai label konsisten (`1`, bukan `1.0`).

Sebelum perbaikan: 59/60 uji sintetis lulus. Sesudah perbaikan: 60/60. Uji produksi benar-benar mengunggah data dan menjalankan E2B: filter `001`, filter `NA`, jumlah identifier unik, dan analisis Python terfilter cocok dengan harapan. Data sumber tidak diubah. Perbaikan telah terpasang melalui commit `6e87b13e9b0a680f84e59c5eb0a010eb3f181da0`.

## Cakupan dataset

Corpus sintetis mencakup retail, cuaca, kualitas air, inventori, keuangan, dukungan pelanggan, logistik, energi, pendidikan, dan pemasaran. Masing-masing memiliki varian bersih, nilai hilang, duplikat, nilai negatif, dan tanpa tanggal. Sepuluh kasus tambahan mencakup file hanya header, satu baris, semua nilai hilang, nilai konstan, pembagi nol, 100.000 baris, 600 kategori, kode berawalan nol, teks Unicode/berisi instruksi, serta nilai ekstrem ±1e12. CSV dan XLSX sama-sama diuji.

Batas penting: 50 kasus domain sintetis memakai pola angka dasar yang sama dengan nama kolom berbeda. Ini berguna untuk regresi dan penanganan schema, tetapi tidak setara dengan 50 pola statistik dunia nyata yang berbeda. Kasus teks berisi instruksi diuji pada perhitungan lokal, bukan sebagai uji keamanan prompt injection terhadap semua model.

Dataset publik berasal dari [Seaborn example data](https://github.com/mwaskom/seaborn-data). Beberapa contoh telah dimodifikasi dari sumber aslinya; repositori tersebut bukan arsip data umum. Semua 20 dataset publik di bawah diperiksa secara lokal, **belum melalui alur AI langsung**. URL dan SHA-256 setiap file disimpan dalam bukti pengujian.

| Dataset publik | Baris |
|---|---:|
| anagrams | 20 |
| anscombe | 44 |
| attention | 60 |
| car_crashes | 51 |
| diamonds | 53,940 |
| dots | 848 |
| dowjones | 649 |
| exercise | 90 |
| flights | 144 |
| fmri | 1,064 |
| geyser | 272 |
| healthexp | 274 |
| iris | 150 |
| mpg | 398 |
| penguins | 344 |
| planets | 1,035 |
| seaice | 13,175 |
| taxis | 6,433 |
| tips | 244 |
| titanic | 891 |

## Metode dan batas verifikasi

Perhitungan menggunakan implementasi dashboard Python yang sebenarnya, lalu dibandingkan dengan perhitungan Pandas independen. Pemeriksaan meliputi jumlah baris, agregasi, produk dua kolom, rata-rata, pembagi nol, kategori, deduplikasi, pilihan tanpa hasil, dan filter tanggal bila tersedia. Bentuk histogram, scatter, dan box plot juga diperiksa. File kosong hanya diperiksa deteksinya, bukan dianalisis oleh AI.

Untuk pengujian langsung, model memilih langkah analisis secara iteratif; alat EDA berjalan pada implementasi aplikasi, Python buatan model dan persiapan dashboard berjalan di E2B asli, dan ringkasan akhir diminta dari fakta terhitung. Dataset sintetis disertai tujuan yang menyebut domain, sehingga ini bukan uji inferensi domain otomatis murni. Filter dari dashboard yang dipilih model dibandingkan dengan oracle independen. Seluruh alur yang lulus tidak melaporkan action error. Dua kasus Python khusus (retail-5 dan weather-5) menghasilkan Spearman 0.0002165978923369305 dengan 90 pasangan lengkap, cocok dengan SciPy.

Pengujian langsung dilakukan melalui API produksi dan orkestrasi agent, bukan 80 sesi klik browser. Pengujian ini belum membuktikan seluruh narasi bisnis benar secara semantik, atau seluruh dashboard publik mudah dipahami manusia. Kasus tanggal sintetis memakai Januari–Maret 2026; filter pada data publik lebih berfokus pada validitas dan pilihan kosong, bukan seluruh rentang tanggal nyata. Uji regresi terpisah untuk komposisi kanvas, label kategori, pemulihan sesi, chart tambahan, orkestrasi agent, dan TypeScript juga lulus. PDF setiap dataset tidak dirender ulang dalam batch ini.

## Kegagalan pengujian langsung

Dari target 50 kasus sintetis, 31 mulai dicoba: 12 lulus penuh, 13 hasil gagal, dan 6 dihentikan saat batch dibatalkan. Ada 19 yang belum dicoba. Sebagian kasus gagal telah menjalankan alat atau membuat dashboard; itu tidak dihitung sebagai alur penuh yang lulus.

Respons yang diamati termasuk `AI_JSON` (respons tidak lengkap/tidak valid), `AI_TIMEOUT`, `AI_HTTP_503`, dan `AI_HTTP_429`. Satu permintaan kontrol hanya tiga baris pada `relink:gpt-5.6-luna` juga menghasilkan HTTP 502 / `AI_JSON`. Ini menunjukkan kegagalan tidak khusus pada dataset besar; belum cukup untuk menentukan apakah penyebab dasarnya provider, quota akun, atau format yang dikembalikan upstream. Tidak ada klaim bahwa saldo habis atau dataset rusak.

Batch dihentikan setelah kesalahan berulang agar tidak terus mengirim permintaan saat layanan dibatasi. Checkpoint dan hasil per kasus disimpan untuk melanjutkan nanti.

| Kasus langsung | Status akhir |
|---|---|
| finance-2 | Lulus penuh |
| finance-3 | Belum selesai: respons model gagal |
| finance-4 | Belum selesai: respons model gagal |
| inventory-1 | Belum selesai: respons model gagal |
| inventory-2 | Belum selesai: respons model gagal |
| inventory-3 | Belum selesai: respons model gagal |
| inventory-4 | Belum selesai: respons model gagal |
| inventory-5 | Belum selesai: respons model gagal |
| retail-1 | Lulus penuh |
| retail-2 | Lulus penuh |
| retail-3 | Lulus penuh |
| retail-4 | Lulus penuh |
| retail-5 | Lulus penuh |
| support-1 | Belum selesai: respons model gagal |
| support-2 | Belum selesai: respons model gagal |
| water-quality-1 | Lulus penuh |
| water-quality-2 | Belum selesai: respons model gagal |
| water-quality-3 | Brief gagal |
| water-quality-4 | Belum selesai: respons model gagal |
| water-quality-5 | Belum selesai: respons model gagal |
| weather-1 | Lulus penuh |
| weather-2 | Lulus penuh |
| weather-3 | Lulus penuh |
| weather-4 | Lulus penuh |
| weather-5 | Lulus penuh |
| finance-1 | Dihentikan; checkpoint tersimpan |
| finance-5 | Dihentikan; checkpoint tersimpan |
| logistics-1 | Dihentikan; checkpoint tersimpan |
| support-3 | Dihentikan; checkpoint tersimpan |
| support-4 | Dihentikan; checkpoint tersimpan |
| support-5 | Dihentikan; checkpoint tersimpan |

## Reproduksi

Script dan bukti tersedia di repositori [AI-DataAnalysis-Agent](https://github.com/UWWAWWU/AI-DataAnalysis-Agent). Dependensi lokal mencakup Node, Pandas, NumPy, openpyxl dan SciPy. Perintah live memakai kredensial server yang sudah terkonfigurasi; dapat memakai quota layanan.

```bash
node scripts/check-diverse-agent-corpus.mjs --generate --local
node scripts/check-public-dataset-corpus.mjs
node scripts/check-python-category-codes.mjs
node scripts/check-live-category-codes.mjs
```

Untuk melanjutkan snapshot sintetis yang disimpan dalam repo, gunakan direktori corpus baru, lalu pulihkan bukti:

```bash
node scripts/check-diverse-agent-corpus.mjs --generate --restore-saved
CORPUS_CONCURRENCY=1 node scripts/check-diverse-agent-corpus.mjs --live
node scripts/check-corpus-statistics.mjs
```

Jalankan batch live berikutnya setelah layanan kembali merespons dengan baik. Kasus lulus dilewati; kasus lain dilanjutkan dari checkpoint. Uji publik live terpisah: `node scripts/check-public-dataset-corpus.mjs --public-live` (lima kasus terpilih, belum dijalankan pada laporan ini).
