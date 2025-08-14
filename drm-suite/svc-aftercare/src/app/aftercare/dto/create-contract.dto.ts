import { IsString, IsDateString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum ContractType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export class CreateContractDto {
  @IsString()
  customerId: string;

  @IsString()
  projectId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus = ContractStatus.DRAFT;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  coverageDetails?: {
    structure?: boolean;
    waterproof?: boolean;
    equipment?: boolean;
    cosmetic?: boolean;
  };

  @IsOptional()
  terms?: {
    paymentSchedule?: string;
    autoRenewal?: boolean;
    cancellationPolicy?: string;
  };
}