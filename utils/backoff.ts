interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000
  } = config;

  let attempt = 1;
  let delay = initialDelay;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * 2, maxDelay);
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 200;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      attempt++;
    }
  }

  throw new Error('Max retry attempts reached');
}