import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { getMarketLogo, detectMarketBrand } from './marketUtils';

export function withConcurrency<T>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  if (limit <= 0) return Promise.all(tasks.map((t) => t()));
  const results: T[] = [] as unknown as T[];
  let index = 0;
  let running = 0;

  return new Promise((resolve, reject) => {
    const runNext = () => {
      if (index >= tasks.length && running === 0) return resolve(results);
      while (running < limit && index < tasks.length) {
        const current = tasks[index++];
        running++;
        current()
          .then((res) => {
            results.push(res);
          })
          .catch(reject)
          .finally(() => {
            running--;
            runNext();
          });
      }
    };
    runNext();
  });
}
