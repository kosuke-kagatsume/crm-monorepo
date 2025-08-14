import { useState, useEffect } from 'react';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budgetPlanned: number;
  budgetActual: number;
  startDate: string;
  endDate: string;
  targetAudience: any;
  channels: string[];
  metrics: any;
  createdAt: string;
  updatedAt: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: '春の新築キャンペーン',
          type: 'email',
          status: 'active',
          budgetPlanned: 1000000,
          budgetActual: 750000,
          startDate: '2024-03-01',
          endDate: '2024-05-31',
          targetAudience: { age: '30-50', location: '東京' },
          channels: ['email', 'social'],
          metrics: { leads: 150, conversions: 25 },
          createdAt: '2024-02-15',
          updatedAt: '2024-03-15',
        },
      ];
      setCampaigns(mockCampaigns);
    } catch (err) {
      setError('キャンペーンの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaign: Partial<Campaign>) => {
    try {
      const newCampaign: Campaign = {
        ...campaign as Campaign,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCampaigns([...campaigns, newCampaign]);
      return newCampaign;
    } catch (err) {
      throw new Error('キャンペーンの作成に失敗しました');
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      setCampaigns(campaigns.map(c => 
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      throw new Error('キャンペーンの更新に失敗しました');
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (err) {
      throw new Error('キャンペーンの削除に失敗しました');
    }
  };

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns,
  };
}