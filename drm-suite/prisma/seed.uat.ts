import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UAT seed...');

  // Clean existing data
  await cleanDatabase();

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'DRM建設株式会社',
      code: 'DRM001',
      plan: 'enterprise',
      settings: JSON.stringify({
        features: {
          aftercare: true,
          ledger: true,
          dw_integration: true,
          rag_copilot: true,
        },
      }),
    },
  });

  console.log('✅ Company created');

  // Create stores
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        companyId: company.id,
        name: '東京本店',
        code: 'TOKYO',
        address: '東京都千代田区丸の内1-1-1',
        location: JSON.stringify({ lat: 35.6762, lng: 139.6503 }),
      },
    }),
    prisma.store.create({
      data: {
        companyId: company.id,
        name: '大阪支店',
        code: 'OSAKA',
        address: '大阪府大阪市北区梅田1-1-1',
        location: JSON.stringify({ lat: 34.7055, lng: 135.4983 }),
      },
    }),
  ]);

  console.log('✅ Stores created');

  // Create users (3 roles × 2 users each)
  const passwordHash = await hash('password123', 10);
  
  const users = await Promise.all([
    // Foreman (施工管理)
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        email: 'foreman1@drm.com',
        name: '山田太郎',
        role: 'foreman',
        passwordHash,
        permissions: JSON.stringify(['view_all', 'edit_projects', 'approve_progress']),
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        email: 'foreman2@drm.com',
        name: '鈴木一郎',
        role: 'foreman',
        passwordHash,
        permissions: JSON.stringify(['view_all', 'edit_projects', 'approve_progress']),
      },
    }),
    // Clerk (事務)
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        email: 'clerk1@drm.com',
        name: '佐藤花子',
        role: 'clerk',
        passwordHash,
        permissions: JSON.stringify(['view_limited', 'create_bookings', 'manage_reception']),
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[1].id,
        email: 'clerk2@drm.com',
        name: '高橋美咲',
        role: 'clerk',
        passwordHash,
        permissions: JSON.stringify(['view_limited', 'create_bookings', 'manage_reception']),
      },
    }),
    // Aftercare (アフターケア)
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        email: 'aftercare1@drm.com',
        name: '伊藤健二',
        role: 'aftercare',
        passwordHash,
        permissions: JSON.stringify(['view_aftercare', 'manage_inspections', 'create_quick_estimates']),
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        storeId: stores[1].id,
        email: 'aftercare2@drm.com',
        name: '渡辺真理',
        role: 'aftercare',
        passwordHash,
        permissions: JSON.stringify(['view_aftercare', 'manage_inspections', 'create_quick_estimates']),
      },
    }),
  ]);

  console.log('✅ Users created');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        customerNumber: 'C001',
        name: '田中建設',
        email: 'tanaka@construction.jp',
        phone: '03-1234-5678',
        address: '東京都新宿区西新宿2-8-1',
        status: 'customer',
        createdBy: users[0].id,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        storeId: stores[0].id,
        customerNumber: 'C002',
        name: '株式会社山本工務店',
        companyName: '株式会社山本工務店',
        email: 'yamamoto@koumuten.jp',
        phone: '03-9876-5432',
        address: '東京都渋谷区渋谷1-1-1',
        status: 'customer',
        createdBy: users[0].id,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        storeId: stores[1].id,
        customerNumber: 'C003',
        name: '関西リフォーム',
        email: 'kansai@reform.jp',
        phone: '06-1111-2222',
        address: '大阪府大阪市中央区本町1-1-1',
        status: 'customer',
        createdBy: users[1].id,
      },
    }),
  ]);

  console.log('✅ Customers created');

  // Create projects with ledgers
  const projects = await Promise.all([
    // 新築プロジェクト（マイルストーン型）
    prisma.projectLedger.create({
      data: {
        companyId: company.id,
        projectId: 'PRJ001',
        ledgerNo: 'L2024-001',
        customerId: customers[0].id,
        projectName: '田中邸新築工事',
        projectType: '新築',
        contractAmount: 50000000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: '着工中',
        progressRate: 35,
        billedAmount: 15000000,
        paidAmount: 10000000,
        retainageRate: 0.05,
        milestones: {
          create: [
            {
              milestoneNo: 1,
              milestoneName: '着工時',
              targetDate: new Date('2024-01-01'),
              targetAmount: 10000000,
              billedDate: new Date('2024-01-15'),
              billedAmount: 10000000,
              status: 'paid',
            },
            {
              milestoneNo: 2,
              milestoneName: '上棟時',
              targetDate: new Date('2024-06-01'),
              targetAmount: 20000000,
              billedDate: new Date('2024-06-15'),
              billedAmount: 20000000,
              status: 'billed',
            },
            {
              milestoneNo: 3,
              milestoneName: '完工時',
              targetDate: new Date('2024-12-01'),
              targetAmount: 20000000,
              status: 'pending',
            },
          ],
        },
        changeOrders: {
          create: {
            coNumber: 'CO-001',
            description: 'キッチン仕様変更',
            amount: 1500000,
            requestDate: new Date('2024-03-15'),
            approvalDate: new Date('2024-03-20'),
            status: 'approved',
            reason: '顧客要望によるグレードアップ',
          },
        },
      },
    }),
    // 外壁リフォーム（出来高％型）
    prisma.projectLedger.create({
      data: {
        companyId: company.id,
        projectId: 'PRJ002',
        ledgerNo: 'L2024-002',
        customerId: customers[1].id,
        projectName: '山本ビル外壁改修工事',
        projectType: 'リフォーム',
        contractAmount: 15000000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        status: '着工中',
        progressRate: 65,
        billedAmount: 9750000,
        paidAmount: 5000000,
        retainageRate: 0.1,
        progressLogs: {
          create: [
            {
              reportDate: new Date('2024-02-28'),
              progressRate: 25,
              completedAmount: 3750000,
              reportedBy: users[0].id,
              approvedBy: users[1].id,
              approvedAt: new Date('2024-03-01'),
              dwSyncStatus: 'synced',
              dwSyncAt: new Date('2024-03-01'),
            },
            {
              reportDate: new Date('2024-03-31'),
              progressRate: 50,
              completedAmount: 7500000,
              reportedBy: users[0].id,
              approvedBy: users[1].id,
              approvedAt: new Date('2024-04-01'),
              dwSyncStatus: 'synced',
              dwSyncAt: new Date('2024-04-01'),
            },
            {
              reportDate: new Date('2024-04-30'),
              progressRate: 65,
              completedAmount: 9750000,
              reportedBy: users[0].id,
              dwSyncStatus: 'pending',
            },
          ],
        },
      },
    }),
    // 屋根修理
    prisma.projectLedger.create({
      data: {
        companyId: company.id,
        projectId: 'PRJ003',
        ledgerNo: 'L2024-003',
        customerId: customers[2].id,
        projectName: '関西リフォーム本社屋根修理',
        projectType: '修繕',
        contractAmount: 3000000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
        status: '完了',
        progressRate: 100,
        billedAmount: 3000000,
        paidAmount: 2850000,
        retainageRate: 0.05,
      },
    }),
  ]);

  console.log('✅ Projects with ledgers created');

  // Create aftercare schedules
  for (const customer of customers) {
    const baseDate = new Date('2023-12-01'); // 引渡日
    const inspectionTypes = [
      { type: '1_month', months: 1 },
      { type: '3_month', months: 3 },
      { type: '6_month', months: 6 },
      { type: '1_year', months: 12 },
    ];

    for (const inspection of inspectionTypes) {
      const scheduledDate = new Date(baseDate);
      scheduledDate.setMonth(scheduledDate.getMonth() + inspection.months);

      await prisma.afterCareSchedule.create({
        data: {
          companyId: company.id,
          storeId: stores[0].id,
          projectId: `PRJ00${customers.indexOf(customer) + 1}`,
          customerId: customer.id,
          inspectionType: inspection.type,
          scheduledDate,
          status: inspection.months <= 3 ? 'completed' : 'scheduled',
          assignedTo: users[4].id, // aftercare user
          reminderSettings: JSON.stringify({
            oneMonth: true,
            oneWeek: true,
            oneDay: false,
          }),
          completedAt: inspection.months <= 3 ? scheduledDate : null,
          completedBy: inspection.months <= 3 ? users[4].id : null,
        },
      });
    }
  }

  console.log('✅ Aftercare schedules created');

  // Create resources for booking
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        type: 'MEETING_ROOM',
        name: '商談室A',
        capacity: 6,
        location: '2F',
        equipment: ['プロジェクター', 'ホワイトボード'],
      },
    }),
    prisma.resource.create({
      data: {
        type: 'MEETING_ROOM',
        name: '商談室B',
        capacity: 4,
        location: '2F',
        equipment: ['モニター', 'ホワイトボード'],
      },
    }),
    prisma.resource.create({
      data: {
        type: 'VEHICLE',
        subType: 'van',
        name: '社用車1号',
        plateNumber: '品川500あ1234',
        equipment: ['GPS', 'ETC'],
      },
    }),
  ]);

  console.log('✅ Resources created');

  console.log('🎉 UAT seed completed successfully!');
}

async function cleanDatabase() {
  // Delete in reverse order of dependencies
  await prisma.warrantyClaim.deleteMany();
  await prisma.warrantyRecord.deleteMany();
  await prisma.customerSatisfaction.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.inspectionReminder.deleteMany();
  await prisma.defectCase.deleteMany();
  await prisma.afterCareSchedule.deleteMany();
  await prisma.milestoneBilling.deleteMany();
  await prisma.retainage.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.ledgerProgress.deleteMany();
  await prisma.ledgerCost.deleteMany();
  await prisma.ledgerBudget.deleteMany();
  await prisma.ledgerSub.deleteMany();
  await prisma.projectLedger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.customerEstimate.deleteMany();
  await prisma.customerInteraction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
  await prisma.company.deleteMany();
  
  console.log('✅ Database cleaned');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });