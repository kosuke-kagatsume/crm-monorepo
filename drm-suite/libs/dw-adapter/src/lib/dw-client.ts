import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RetryHandler } from './retry-handler';
import { KafkaService } from '@drm-suite/event-bus';
import {
  DWProgress,
  DWClaim,
  DWApproveProgressRequest,
  DWCreateChangeOrderRequest,
  DWResponse,
  DWLedgerSyncRequest,
  DWMaintenanceRequest,
  DWInspectionResult,
  DWVisitorNotification,
  DWNotificationRequest,
} from './types';

@Injectable()
export class DWClient {
  private readonly logger = new Logger(DWClient.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly retryHandler: RetryHandler,
    private readonly kafkaService: KafkaService,
  ) {
    this.baseUrl = process.env.DW_API_URL || 'https://sandbox.dw-api.com/v1';
  }

  /**
   * Get progress data from DW
   */
  async getProgress(siteId: string): Promise<DWProgress | null> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.get<DWProgress>(`${this.baseUrl}/progress`, {
              params: { siteId },
              headers: this.getHeaders(),
            }),
          );
          return res.data;
        },
        'getProgress',
        { siteId },
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get progress for site ${siteId}`, error);
      await this.sendToDLQ('progress.get.failed', { siteId, error: error.message });
      return null;
    }
  }

  /**
   * Get claims from DW
   */
  async getClaims(projectId: string): Promise<DWClaim[]> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.get<DWClaim[]>(`${this.baseUrl}/claims`, {
              params: { projectId },
              headers: this.getHeaders(),
            }),
          );
          return res.data;
        },
        'getClaims',
        { projectId },
      );

      return response || [];
    } catch (error) {
      this.logger.error(`Failed to get claims for project ${projectId}`, error);
      await this.sendToDLQ('claims.get.failed', { projectId, error: error.message });
      return [];
    }
  }

  /**
   * Approve progress in DW
   */
  async approveProgress(request: DWApproveProgressRequest): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/progress/approve`,
              request,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'approveProgress',
        request,
      );

      this.logger.log(`Progress approved for site ${request.siteId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to approve progress for site ${request.siteId}`, error);
      
      // Send to DLQ for manual processing
      await this.sendToDLQ('progress.approve.failed', {
        request,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Create change order in DW
   */
  async createChangeOrder(request: DWCreateChangeOrderRequest): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/change-orders`,
              request,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'createChangeOrder',
        request,
      );

      this.logger.log(`Change order created for project ${request.projectId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create change order for project ${request.projectId}`,
        error,
      );

      // Send to DLQ for manual processing
      await this.sendToDLQ('change-order.create.failed', {
        request,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Bulk sync progress data
   */
  async bulkSyncProgress(
    progressData: DWApproveProgressRequest[],
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const results = {
      succeeded: [] as string[],
      failed: [] as string[],
    };

    for (const data of progressData) {
      try {
        await this.approveProgress(data);
        results.succeeded.push(data.siteId);
      } catch (error) {
        results.failed.push(data.siteId);
      }
    }

    return results;
  }

  /**
   * Health check for DW API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          headers: this.getHeaders(),
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn('DW API health check failed', error);
      return false;
    }
  }

  /**
   * Get headers for DW API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.DW_API_KEY || '',
      'X-Client-ID': process.env.DW_CLIENT_ID || 'drm-suite',
      'X-Request-ID': this.generateRequestId(),
    };
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send failed message to DLQ (Kafka topic)
   */
  private async sendToDLQ(eventType: string, payload: any): Promise<void> {
    try {
      await this.kafkaService.emit('dw.dlq', {
        eventType,
        payload,
        timestamp: new Date().toISOString(),
        retryCount: payload.retryCount || 0,
      });
      
      this.logger.log(`Message sent to DLQ: ${eventType}`);
    } catch (error) {
      this.logger.error('Failed to send message to DLQ', error);
      // Last resort: write to file or database
      await this.writeToFailureLog(eventType, payload);
    }
  }

  /**
   * Fallback: Write to failure log when DLQ is unavailable
   */
  private async writeToFailureLog(eventType: string, payload: any): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logDir = path.join(process.cwd(), 'logs', 'dw-failures');
    await fs.mkdir(logDir, { recursive: true });
    
    const filename = `${eventType}_${Date.now()}.json`;
    const filepath = path.join(logDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify({ eventType, payload }, null, 2));
    this.logger.warn(`DLQ unavailable, wrote to file: ${filepath}`);
  }

  // ==================== v1.0 新機能: 工事台帳連携 ====================

  /**
   * Sync ledger data to DW
   */
  async syncLedger(request: DWLedgerSyncRequest): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/ledgers/sync`,
              request,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'syncLedger',
        request,
      );

      this.logger.log(`Ledger synced to DW for project ${request.projectId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to sync ledger for project ${request.projectId}`,
        error,
      );

      await this.sendToDLQ('ledger.sync.failed', {
        request,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Get progress with photos and checklist from DW
   */
  async getProgressWithDetails(siteId: string): Promise<DWProgress | null> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.get<DWProgress>(`${this.baseUrl}/progress/details`, {
              params: { siteId },
              headers: this.getHeaders(),
            }),
          );
          return res.data;
        },
        'getProgressWithDetails',
        { siteId },
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get progress details for site ${siteId}`, error);
      await this.sendToDLQ('progress.details.get.failed', { siteId, error: error.message });
      return null;
    }
  }

  // ==================== v1.0 新機能: アフター管理連携 ====================

  /**
   * Create maintenance schedule in DW
   */
  async createMaintenanceSchedule(request: DWMaintenanceRequest): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/maintenance/schedule`,
              request,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'createMaintenanceSchedule',
        request,
      );

      this.logger.log(`Maintenance schedule created for contract ${request.contractId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create maintenance schedule for contract ${request.contractId}`,
        error,
      );

      await this.sendToDLQ('maintenance.schedule.create.failed', {
        request,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Submit inspection result to DW
   */
  async submitInspectionResult(result: DWInspectionResult): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/inspections/result`,
              result,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'submitInspectionResult',
        result,
      );

      this.logger.log(`Inspection result submitted for ${result.inspectionId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to submit inspection result for ${result.inspectionId}`,
        error,
      );

      await this.sendToDLQ('inspection.result.submit.failed', {
        result,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // ==================== v1.0 新機能: 受付・通知連携 ====================

  /**
   * Notify DW about visitor arrival
   */
  async notifyVisitorArrival(notification: DWVisitorNotification): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/visitors/notify`,
              notification,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'notifyVisitorArrival',
        notification,
      );

      this.logger.log(`Visitor arrival notified: ${notification.visitorName}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to notify visitor arrival for ${notification.visitorName}`,
        error,
      );

      await this.sendToDLQ('visitor.notify.failed', {
        notification,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Send notification through DW
   */
  async sendNotification(request: DWNotificationRequest): Promise<DWResponse> {
    try {
      const response = await this.retryHandler.executeWithRetry(
        async () => {
          const res = await firstValueFrom(
            this.httpService.post<DWResponse>(
              `${this.baseUrl}/notifications/send`,
              request,
              {
                headers: this.getHeaders(),
              },
            ),
          );
          return res.data;
        },
        'sendNotification',
        request,
      );

      this.logger.log(`Notification sent via DW to ${request.recipientId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${request.recipientId}`,
        error,
      );

      await this.sendToDLQ('notification.send.failed', {
        request,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }
}