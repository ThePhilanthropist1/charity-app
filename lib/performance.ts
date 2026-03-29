export const cacheConfig = {
  // Cache strategies for different data types
  user: {
    revalidate: 60 * 5, // 5 minutes
    tags: ['user'],
  },
  distributions: {
    revalidate: 60 * 10, // 10 minutes
    tags: ['distributions'],
  },
  kyc: {
    revalidate: 60 * 60, // 1 hour
    tags: ['kyc'],
  },
  static: {
    revalidate: 60 * 60 * 24, // 24 hours
    tags: ['static'],
  },
};

export const isomorphicFetch = async (url: string, options?: RequestInit) => {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // In production, implement Redis caching here
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};
