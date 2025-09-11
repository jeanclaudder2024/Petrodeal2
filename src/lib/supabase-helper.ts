// Temporary helper to bypass TypeScript errors until database types are generated
import { supabase } from '@/integrations/supabase/client';

// Add timeout wrapper for database operations
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    )
  ]);
};

export const db = {
  from: (table: string) => {
    const query = (supabase as any).from(table);
    
    // Helper to wrap any method that returns a promise
    const wrapMethod = (method: string) => (...args: any[]) => {
      const result = query[method](...args);
      if (result && typeof result.then === 'function') {
        // Add timeout to the final promise
        const originalThen = result.then;
        result.then = function(onFulfilled?: any, onRejected?: any) {
          return withTimeout(originalThen.call(this, onFulfilled, onRejected));
        };
      }
      return result;
    };
    
    // Return the original query object with wrapped methods
    return {
      ...query,
      select: wrapMethod('select'),
      insert: wrapMethod('insert'),
      update: wrapMethod('update'),
      delete: wrapMethod('delete'),
      upsert: wrapMethod('upsert')
    };
  }
};

// Export supabase for other uses like subscriptions
export { supabase };