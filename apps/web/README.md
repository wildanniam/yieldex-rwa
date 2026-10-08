# Web / request backend

Starter memiliki halaman `/` dan `GET /api/health` (process liveness, bukan readiness integrasi). Semua API produk `/api/v1/*`, autentikasi, wallet dan CopilotKit masih task implementasi; route yang belum dibuat menghasilkan 404.

- `src/app`: pages dan HTTP route adapters.
- `src/server`: domain services/provider adapters khusus server. API dan AI tools kelak menggunakan layanan yang sama.
- `@rwa/shared`: types/config browser-safe; validator lewat `@rwa/shared/validation`, ABI interface lewat `@rwa/shared/abi`.

API/AI secrets hanya di server. Kunci finalizer tidak boleh masuk package web. UI produk mengikuti desainer; halaman starter adalah informasi untuk developer.
