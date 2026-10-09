import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { marketContext } from '../market/context';
import { Web3Sessions } from './service';
import { ApiFailure } from '../http';
export async function authContext() {
  const {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    APP_ORIGIN: origin,
  } = process.env;
  if (!url || !key || !origin)
    throw new ApiFailure(
      503,
      'AUTH_UNAVAILABLE',
      'Autentikasi belum dikonfigurasi.',
    );
  const { db, reader } = await marketContext();
  const chainId = reader.manifest.chainId;
  if (chainId !== 31337 && chainId !== 11155111)
    throw new ApiFailure(
      400,
      'UNSUPPORTED_DEPLOYMENT',
      'Chain tidak didukung.',
    );
  const store = await cookies();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) =>
        values.forEach(({ name, value, options }) =>
          store.set(name, value, options),
        ),
    },
  });
  const service = new Web3Sessions(db, { url, key, origin, chainId });
  const session = async () => {
    const { data } = await client.auth.getSession();
    if (!data.session)
      throw new ApiFailure(401, 'AUTH_REQUIRED', 'Login wallet diperlukan.');
    const verified = await service.verify(data.session.access_token);
    return { verified, accessToken: data.session.access_token };
  };
  return { service, client, store, session };
}
