import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { getMarketLogo, detectMarketBrand } from './marketUtils';

/** Sınırlı eşzamanlılık; sonuç sırası task sırasıyla korunur */
export function withConcurrency<T>(
  limit: number,
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  if (tasks.length === 0) return Promise.resolve([]);
  if (limit <= 0) return Promise.all(tasks.map((t) => t()));

  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  let running = 0;
  let rejected = false;

  return new Promise((resolve, reject) => {
    const launch = () => {
      if (rejected) return;
      if (nextIndex >= tasks.length && running === 0) {
        resolve(results);
        return;
      }

      while (running < limit && nextIndex < tasks.length) {
        const i = nextIndex++;
        running++;
        tasks[i]()
          .then((res) => {
            results[i] = res;
          })
          .catch((err) => {
            rejected = true;
            reject(err);
          })
          .finally(() => {
            running--;
            if (!rejected) launch();
          });
      }
    };
    launch();
  });
}
