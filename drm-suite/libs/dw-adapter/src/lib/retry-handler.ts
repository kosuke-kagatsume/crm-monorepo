import { Injectable, Logger } from '@nestjs/common';
import { delay } from 'rxjs';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

@Injectable()
export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);
  private readonly defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [500, 502, 503, 504, 429],
  };

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any,
    config?: RetryConfig,
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Executing ${operationName}, attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`,
        );
        
        const result = await operation();
        
        if (attempt > 0) {
          this.logger.log(
            `${operationName} succeeded after ${attempt} retries`,
          );
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error, attempt, finalConfig)) {
          throw error;
        }

        const delayMs = this.calculateDelay(attempt, finalConfig);
        
        this.logger.warn(
          `${operationName} failed (attempt ${attempt + 1}), retrying in ${delayMs}ms`,
          {
            error: error.message,
            context,
          },
        );

        await this.sleep(delayMs);
      }
    }

    this.logger.error(
      `${operationName} failed after ${finalConfig.maxRetries} retries`,
      {
        error: lastError?.message,
        context,
      },
    );

    throw lastError;
  }

  private shouldRetry(
    error: any,
    attempt: number,
    config: Required<RetryConfig>,
  ): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Network errors should be retried
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Check HTTP status codes
    if (error.response?.status) {
      return config.retryableStatusCodes.includes(error.response.status);
    }

    // Default: don't retry unknown errors
    return false;
  }

  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    // Exponential backoff with jitter
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5);
    
    return Math.min(delayWithJitter, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}