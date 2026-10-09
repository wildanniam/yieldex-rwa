import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COIN_DATA = `
DATA KOIN YIELDEX (SELALU GUNAKAN DATA INI UNTUK MENJAWAB):

1. SPYx — S&P 500 Tokenized Yield
   - Harga: 505.20 USDC
   - Volume Harian: 1.2M USDC
   - APY: 8.5%
   - Tren: Bullish (+2.4% hari ini)
   - Deskripsi: Token SPYx mewakili hak pendapatan dari ETF S&P 500. Sedang hype karena laporan pendapatan perusahaan teknologi besar (Big Tech) yang melebihi ekspektasi, memicu lonjakan volume pembelian di Yieldex. Investor memburu dividen kuartal ini yang diprediksi akan meningkat.
   - Dividen dibayar setiap akhir bulan dalam USDC.
   - Underlying asset: SPDR S&P 500 ETF Trust
   - Network: Sepolia Testnet (demo)

2. AAPLx — Apple Inc. Tokenized Dividend
   - Harga: 175.50 USDC
   - Volume Harian: 850K USDC
   - APY: 5.2%
   - Tren: Stabil (+0.8% hari ini)
   - Deskripsi: Token AAPLx adalah perwakilan hak dividen saham Apple. Meskipun pertumbuhannya stabil, koin ini tetap menarik minat besar karena peluncuran produk baru Apple yang membuat sentimen pasar sangat positif. Dividen dijamin dibayar dalam USDC setiap akhir bulan.
   - Underlying asset: Apple Inc. (AAPL) stock dividend rights
   - Network: Sepolia Testnet (demo)

Mata uang pembayaran: USDC (stablecoin pegged 1:1 ke USD)
`;

const SYSTEM_PROMPT = `Anda adalah asisten virtual resmi platform Yieldex — sebuah platform RWA (Real World Asset) Income Rights yang memungkinkan pengguna membeli token yang mewakili hak pendapatan (dividen) dari saham-saham dunia nyata.

ATURAN KETAT:
1. Anda HANYA BOLEH membahas topik yang berhubungan dengan platform Yieldex, token-token di dalamnya (SPYx, AAPLx), USDC, dan mekanisme platform (beli, jual, klaim dividen, wallet).
2. Jika pengguna bertanya tentang hal APAPUN di luar topik Yieldex (seperti presiden, politik, cuaca, berita, koin kripto publik seperti Bitcoin/BTC, Ethereum/ETH, Solana/SOL, atau topik umum lainnya), Anda WAJIB menjawab PERSIS dengan kalimat: "Maaf, saya hanya fokus untuk membahas coin di dalam Yieldex. Silakan tanyakan seputar token SPYx, AAPLx, atau fitur platform kami!"
3. Jika pengguna bertanya "koin apa yang hype", "koin", "tren", "rekomendasi", atau pertanyaan umum seputar koin/investasi TANPA menyebutkan nama koin spesifik di luar Yieldex, ASUMSIKAN mereka bertanya tentang koin Yieldex dan berikan jawaban PANJANG dan DETAIL menggunakan data di bawah ini.
4. Jawaban Anda harus selalu dalam Bahasa Indonesia, panjang, detail, dan informatif ketika membahas koin Yieldex.

${COIN_DATA}`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY belum dikonfigurasi.' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content ?? 'Maaf, terjadi kesalahan.';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
