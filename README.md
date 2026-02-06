[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=22130639&assignment_repo_type=AssignmentRepo)

# GC01

## My Social Media App

My Social Media App adalah aplikasi sosial media berbasis mobile dengan arsitektur client-server yang menyatukan sisi frontend dan backend dalam satu proyek. Aplikasi ini dirancang sebagai portofolio end-to-end: pengguna dapat mendaftar dan login, membuat serta membagikan post, berinteraksi lewat komentar dan like, mengikuti pengguna lain, melihat daftar followers dan following, serta melakukan pencarian user berdasarkan nama atau username. Data post ditampilkan dari yang paling baru, dan interaksi pengguna disimpan secara konsisten melalui skema database yang mendukung relasi antar user dan post.

Aplikasi dibagi menjadi dua bagian utama yang saling terhubung: aplikasi mobile sebagai antarmuka pengguna dan server API sebagai pusat data serta logika bisnis. Aplikasi mobile menangani alur autentikasi, navigasi halaman, form input, dan menampilkan feed serta detail post. Server API menangani validasi data, autentikasi, manajemen akun, relasi follow, penyimpanan post dan komentar, serta perhitungan total like.

### Struktur Folder

- [ ] server: untuk menyimpan aplikasi server GraphQL kamu
- [ ] app: untuk menyimpan aplikasi mobile React Native kamu

### Fitur

- [ ] Register: pendaftaran akun baru dengan validasi data pengguna
- [ ] Login: autentikasi dan penyimpanan sesi pengguna
- [ ] Add Post: membuat post baru dengan konten dan metadata
- [ ] Show Post: menampilkan feed post dari yang terbaru
- [ ] Comment Post: komentar disimpan sebagai embedded document
- [ ] Search User: pencarian user berdasarkan nama atau username
- [ ] Follow: mengikuti user lain dan mengelola relasi follow
- [ ] Followers/Following: menampilkan daftar followers dan following
- [ ] Like Post: menambahkan like pada post
- [ ] Total Like: menampilkan jumlah like pada setiap post

### Alur Utama Pengguna

1. Pengguna mendaftar akun lalu login.
2. Pengguna membuat post dan melihat feed terbaru.
3. Pengguna memberi komentar atau like pada post.
4. Pengguna mengikuti user lain dan melihat daftar followers/following.
5. Pengguna mencari user lain melalui fitur search.
