# Sistem Keuangan Ormawa

Platform manajemen keuangan untuk organisasi kemahasiswaan (Ormawa).

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Folder

```
src/app/
├── (auth)/           # Route group untuk autentikasi
│   ├── login/        # Halaman login
│   └── layout.tsx    # Layout auth
├── (dashboard)/      # Route group untuk dashboard bendahara
│   ├── layout.tsx    # Layout dashboard
│   └── page.tsx      # Halaman utama dashboard
├── globals.css       # Global styles (Tailwind)
├── layout.tsx        # Root layout
└── page.tsx          # Halaman utama
```

## License

Private
