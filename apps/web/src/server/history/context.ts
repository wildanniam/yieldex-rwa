import { marketContext } from '../market/context';
import { History } from './service';
import { HistoryCursor } from './cursor';
export async function historyContext() {
  const { db } = await marketContext();
  return new History(db, new HistoryCursor(process.env.CURSOR_SECRET ?? ''));
}
