# Shared interface package

Sumber format data adalah `schemas/` di root. `pnpm generate` menghasilkan TypeScript, runtime schema registry dan ABI interface; `pnpm generate:check` gagal jika hasil tertinggal. Package menggunakan source exports TypeScript untuk Next.js/tsx; belum dipublikasikan ke registry.

```ts
import { INTERFACE_VERSION } from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';

const result = validateData('domain.Listing', unknownResponse);
if (result.success) {
  // result.data is typed; financial integer values remain strings.
}
```

TypeScript types tidak mewakili seluruh constraint JSON Schema (misalnya regex/range/conditional). Selalu jalankan runtime validator untuk payload eksternal. Schema-valid juga belum membuktikan identity/ownership/authorization/current chain state. Tiga semantic-invalid fixtures tetap memerlukan validator domain pada task implementasi.

Package ini aman dibaca browser: tidak boleh mengimpor server services, env secrets, database service-role client atau wallet signer. ABI interface tidak mempunyai deployment address.
