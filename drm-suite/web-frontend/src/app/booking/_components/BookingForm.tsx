'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface BookingFormProps {
  initialData?: {
    type?: 'room' | 'vehicle';
    customerId?: string;
    storeId?: string;
    memo?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ダミーデータ
const resources = {
  room: [
    { id: 'ROOM-001', name: '商談室A', storeId: 'STORE-001', capacity: 4 },
    { id: 'ROOM-002', name: '商談室B', storeId: 'STORE-001', capacity: 6 },
    { id: 'ROOM-003', name: '応接室', storeId: 'STORE-001', capacity: 8 },
    { id: 'ROOM-004', name: '会議室1', storeId: 'STORE-002', capacity: 10 },
    { id: 'ROOM-005', name: '会議室2', storeId: 'STORE-002', capacity: 4 },
  ],
  vehicle: [
    {
      id: 'VEH-001',
      name: 'プリウス（品川300あ1234）',
      storeId: 'STORE-001',
      type: '普通車',
    },
    {
      id: 'VEH-002',
      name: 'ヴォクシー（品川500き5678）',
      storeId: 'STORE-001',
      type: 'ミニバン',
    },
    {
      id: 'VEH-003',
      name: 'ハイエース（品川400さ9012）',
      storeId: 'STORE-001',
      type: 'バン',
    },
    {
      id: 'VEH-004',
      name: 'アクア（大阪300た3456）',
      storeId: 'STORE-002',
      type: '普通車',
    },
    {
      id: 'VEH-005',
      name: 'N-BOX（大阪580な7890）',
      storeId: 'STORE-002',
      type: '軽自動車',
    },
  ],
};

const stores = [
  { id: 'STORE-001', name: '東京本店' },
  { id: 'STORE-002', name: '大阪支店' },
  { id: 'STORE-003', name: '名古屋支店' },
];

const customers = [
  { id: 'CUST-001', name: '山田太郎' },
  { id: 'CUST-002', name: '鈴木一郎' },
  { id: 'CUST-003', name: '田中花子' },
  { id: 'CUST-004', name: '佐藤次郎' },
];

const staff = [
  { id: 'STAFF-001', name: '営業 太郎' },
  { id: 'STAFF-002', name: '営業 花子' },
  { id: 'STAFF-003', name: '事務 一郎' },
  { id: 'STAFF-004', name: '施工 次郎' },
];

export function BookingForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    type: initialData.type || 'room',
    resourceId: '',
    customerId: initialData.customerId || '',
    staffId: '',
    storeId: initialData.storeId || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    memo: initialData.memo || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.resourceId) {
      newErrors.resourceId =
        formData.type === 'room'
          ? '会議室を選択してください'
          : '車両を選択してください';
    }
    if (!formData.customerId) {
      newErrors.customerId = '顧客を選択してください';
    }
    if (!formData.staffId) {
      newErrors.staffId = '担当者を選択してください';
    }
    if (!formData.storeId) {
      newErrors.storeId = '拠点を選択してください';
    }
    if (!formData.date) {
      newErrors.date = '日付を入力してください';
    }
    if (!formData.startTime) {
      newErrors.startTime = '開始時刻を入力してください';
    }
    if (!formData.endTime) {
      newErrors.endTime = '終了時刻を入力してください';
    }

    // 時間の妥当性チェック
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (start >= end) {
        newErrors.endTime = '終了時刻は開始時刻より後に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // リソース情報を取得
    const resourceList =
      formData.type === 'room' ? resources.room : resources.vehicle;
    const resource = resourceList.find((r) => r.id === formData.resourceId);
    const customer = customers.find((c) => c.id === formData.customerId);
    const staffMember = staff.find((s) => s.id === formData.staffId);
    const store = stores.find((s) => s.id === formData.storeId);

    // 送信データを構築
    const submitData = {
      type: formData.type,
      resourceId: formData.resourceId,
      resourceName: resource?.name || '',
      customerId: formData.customerId,
      customerName: customer?.name || '',
      staffId: formData.staffId,
      staffName: staffMember?.name || '',
      storeId: formData.storeId,
      storeName: store?.name || '',
      startTime: new Date(
        `${formData.date}T${formData.startTime}`,
      ).toISOString(),
      endTime: new Date(`${formData.date}T${formData.endTime}`).toISOString(),
      status: 'confirmed',
      memo: formData.memo,
    };

    onSubmit(submitData);
  };

  // 選択された店舗に応じてリソースをフィルタリング
  const filteredResources =
    formData.type === 'room'
      ? resources.room.filter(
          (r) => !formData.storeId || r.storeId === formData.storeId,
        )
      : resources.vehicle.filter(
          (r) => !formData.storeId || r.storeId === formData.storeId,
        );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 予約タイプ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          予約タイプ *
        </label>
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => {
              handleChange('type', 'room');
              handleChange('resourceId', ''); // リソース選択をリセット
            }}
            variant={formData.type === 'room' ? 'default' : 'outline'}
          >
            🏢 会議室
          </Button>
          <Button
            type="button"
            onClick={() => {
              handleChange('type', 'vehicle');
              handleChange('resourceId', ''); // リソース選択をリセット
            }}
            variant={formData.type === 'vehicle' ? 'default' : 'outline'}
          >
            🚗 車両
          </Button>
        </div>
      </div>

      {/* 拠点選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          拠点 *
        </label>
        <select
          value={formData.storeId}
          onChange={(e) => handleChange('storeId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg ${errors.storeId ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">選択してください</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        {errors.storeId && (
          <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>
        )}
      </div>

      {/* リソース選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.type === 'room' ? '会議室' : '車両'} *
        </label>
        <select
          value={formData.resourceId}
          onChange={(e) => handleChange('resourceId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg ${errors.resourceId ? 'border-red-500' : 'border-gray-300'}`}
          disabled={!formData.storeId}
        >
          <option value="">
            {formData.storeId
              ? '選択してください'
              : '先に拠点を選択してください'}
          </option>
          {filteredResources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
              {formData.type === 'room' && ` (定員${resource.capacity}名)`}
            </option>
          ))}
        </select>
        {errors.resourceId && (
          <p className="text-red-500 text-sm mt-1">{errors.resourceId}</p>
        )}
      </div>

      {/* 顧客選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          顧客 *
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => handleChange('customerId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg ${errors.customerId ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">選択してください</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId && (
          <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
        )}
      </div>

      {/* 担当者選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          担当者 *
        </label>
        <select
          value={formData.staffId}
          onChange={(e) => handleChange('staffId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg ${errors.staffId ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">選択してください</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.staffId && (
          <p className="text-red-500 text-sm mt-1">{errors.staffId}</p>
        )}
      </div>

      {/* 日時選択 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日付 *
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            開始時刻 *
          </label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            min="08:00"
            max="20:00"
            className={errors.startTime ? 'border-red-500' : ''}
          />
          {errors.startTime && (
            <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            終了時刻 *
          </label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            min="08:00"
            max="20:00"
            className={errors.endTime ? 'border-red-500' : ''}
          />
          {errors.endTime && (
            <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メモ・備考
        </label>
        <textarea
          value={formData.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="来店目的、特記事項など"
        />
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? '予約中...' : '予約を作成'}
        </Button>
      </div>
    </form>
  );
}
