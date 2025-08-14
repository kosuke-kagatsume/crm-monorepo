import { useSearchParams } from 'next/navigation';
import {
  parseFeatureFlags,
  defaultFlags,
  type FeatureFlags,
} from '@/config/featureFlags';

export function useFeatureFlags() {
  const searchParams = useSearchParams();

  const flags = parseFeatureFlags(searchParams);

  return {
    flags,
    isEnabled: (flag: keyof FeatureFlags) => flags[flag],
    debugInfo: process.env.NODE_ENV === 'development' ? flags : undefined,
  };
}
