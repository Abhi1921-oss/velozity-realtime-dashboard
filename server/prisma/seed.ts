import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, TaskStatus, TaskPriority, NotificationType } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting Velozity dashboard database seeding...');

  // 1. Clean existing records in reverse order of foreign keys
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Cleared existing tables.');

  // Common password hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
  const devPasswordHash = await bcrypt.hash('Dev@123', 10);

  // 2. Create Users: 1 Admin, 2 Project Managers, 4 Developers
  const admin = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'admin@velozity.internal',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah.pm@velozity.internal',
      passwordHash: managerPasswordHash,
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'marcus.pm@velozity.internal',
      passwordHash: managerPasswordHash,
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex.dev@velozity.internal',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.dev@velozity.internal',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: 'Chen Wei',
      email: 'chen.dev@velozity.internal',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: 'Jordan Hayes',
      email: 'jordan.dev@velozity.internal',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('[Seed] Created 7 users: 1 Admin, 2 PMs, 4 Developers.');

  // 3. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Enterprises',
      email: 'contact@acmecorp.com',
      company: 'Acme Global Holdings',
      phone: '+1 (555) 234-5678',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'FinTech Velocity Systems',
      email: 'security@fintechvelocity.io',
      company: 'FinTech Velocity Corp',
      phone: '+1 (555) 876-5432',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Starlight Interactive Media',
      email: 'support@starlightmedia.com',
      company: 'Starlight Group LLC',
      phone: '+1 (555) 998-1122',
    },
  });

  console.log('[Seed] Created 3 clients.');

  // 4. Create Projects (Sarah owns 2 projects, Marcus owns 1 project)
  const project1 = await prisma.project.create({
    data: {
      name: 'Project Nova: Cloud Infrastructure Migration',
      description: 'Zero-downtime microservices containerization and Kubernetes cluster provisioning on AWS.',
      clientId: client1.id,
      ownerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'FinTech Secure Payment Engine',
      description: 'PCI-DSS certified gateway integration with real-time fraud scoring algorithms and biometrics.',
      clientId: client2.id,
      ownerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Starlight Mobile Video Streaming',
      description: 'Ultra-low latency HLS live stream client app with interactive real-time chat widgets.',
      clientId: client3.id,
      ownerId: pm2.id,
    },
  });

  console.log('[Seed] Created 3 projects across 2 PMs.');

  // Helper date generators
  const pastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const futureDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
  };

  // 5. Create Tasks (At least 5+ tasks each, with 2+ overdue)
  // Project 1 Tasks (Sarah PM)
  const t1 = await prisma.task.create({
    data: {
      title: 'Design Multi-Region Kubernetes Architecture',
      description: 'Draft topology diagram, ingress load balancers, and Terraform state backend lock.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate(5),
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const t2 = await prisma.task.create({
    data: {
      title: 'Configure PostgreSQL Read Replicas & Connection Pooling',
      description: 'Deploy PgBouncer cluster with automated health checks and failover triggers.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate(3),
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const t3 = await prisma.task.create({
    data: {
      title: 'Implement OAuth2 / OIDC Token Verification Service',
      description: 'Enforce asymmetric RSA256 signature checks with rotation caching in Redis.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDate(1),
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  const t4 = await prisma.task.create({
    data: {
      title: 'Migrate Legacy DNS Records to Route53',
      description: 'Cutover apex and wildcard subdomains with low TTL before final cutover.',
      status: TaskStatus.OVERDUE, // Overdue task #1
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate(2),
      projectId: project1.id,
      assignedToId: dev3.id,
    },
  });

  const t5 = await prisma.task.create({
    data: {
      title: 'Draft Prometheus Alerting Rules for Pod Evictions',
      description: 'Set alerts for OOM kills, throttling, and persistent volume capacity exhaustion.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate(7),
      projectId: project1.id,
      assignedToId: dev4.id,
    },
  });

  const t6 = await prisma.task.create({
    data: {
      title: 'Perform Chaos Engineering Failover Drills',
      description: 'Simulate availability zone blackhole and assess automatic target recovery latency.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate(14),
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  // Project 2 Tasks (Sarah PM)
  const t7 = await prisma.task.create({
    data: {
      title: 'Integrate Stripe Webhook Idempotency Store',
      description: 'Store incoming event identifiers with distributed lock to avoid double charges.',
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate(4),
      projectId: project2.id,
      assignedToId: dev2.id,
    },
  });

  const t8 = await prisma.task.create({
    data: {
      title: 'Build Fraud Scoring Rules Engine',
      description: 'Analyze velocity of transactions per IP and device fingerprint within 10-minute window.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate(2),
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  const t9 = await prisma.task.create({
    data: {
      title: 'Cardholder Data Masking & Tokenization Service',
      description: 'Ensure PAN and CVV never touch unencrypted memory or application log pipelines.',
      status: TaskStatus.OVERDUE, // Overdue task #2
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate(3),
      projectId: project2.id,
      assignedToId: dev1.id,
    },
  });

  const t10 = await prisma.task.create({
    data: {
      title: 'Implement 3D-Secure 2.0 Fallback Redirect Flow',
      description: 'Handle frictionless and challenge flows seamlessly with modal iframe callbacks.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate(4),
      projectId: project2.id,
      assignedToId: dev4.id,
    },
  });

  const t11 = await prisma.task.create({
    data: {
      title: 'Automated Daily Reconciliation Settlement Job',
      description: 'Parse bank clearing files and correlate ledger entries against completed transactions.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate(10),
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  // Project 3 Tasks (Marcus PM)
  const t12 = await prisma.task.create({
    data: {
      title: 'Implement WebRTC Signaling Protocol',
      description: 'Establish SDP offer/answer handshakes and ICE candidate forwarding over WebSockets.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate(6),
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  const t13 = await prisma.task.create({
    data: {
      title: 'Adaptive Bitrate HLS Video Transcoding Pipeline',
      description: 'Slice incoming RTMP feed into 1080p, 720p, 480p TS segments with FFmpeg workers.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate(2),
      projectId: project3.id,
      assignedToId: dev1.id,
    },
  });

  const t14 = await prisma.task.create({
    data: {
      title: 'Chat Message Rate Limiter & Bad Word Filter',
      description: 'Token bucket rate limiting at 5 msgs/sec per user with Bloom filter dictionary matching.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate(5),
      projectId: project3.id,
      assignedToId: dev2.id,
    },
  });

  const t15 = await prisma.task.create({
    data: {
      title: 'CDN Cache Purge API Integration for VoD Assets',
      description: 'Trigger edge invalidation upon video re-encoding or metadata updates.',
      status: TaskStatus.OVERDUE, // Overdue task #3
      priority: TaskPriority.HIGH,
      dueDate: pastDate(1),
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  const t16 = await prisma.task.create({
    data: {
      title: 'Mobile Push Notification Trigger for Live Broadcasts',
      description: 'Send APNS and FCM high-priority broadcast alerts when creator goes live.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate(8),
      projectId: project3.id,
      assignedToId: dev3.id,
    },
  });

  console.log('[Seed] Created 16 tasks across 3 projects with 3 overdue tasks.');

  // 6. Pre-existing Activity Log Entries (so feed is not empty on first load)
  const activityLogs = [
    {
      taskId: t1.id,
      projectId: project1.id,
      userId: dev1.id,
      userName: dev1.name,
      taskTitle: t1.title,
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      actionText: `${dev1.name} moved Task #${t1.id} from In Review → Done`,
      createdAt: pastDate(4),
    },
    {
      taskId: t3.id,
      projectId: project1.id,
      userId: dev2.id,
      userName: dev2.name,
      taskTitle: t3.title,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      actionText: `${dev2.name} moved Task #${t3.id} from In Progress → In Review`,
      createdAt: pastDate(1),
    },
    {
      taskId: t4.id,
      projectId: project1.id,
      userId: null,
      userName: 'System Scheduler',
      taskTitle: t4.title,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.OVERDUE,
      actionText: `System marked Task #${t4.id} (${t4.title}) from In Progress → Overdue · due date passed`,
      createdAt: pastDate(2),
    },
    {
      taskId: t2.id,
      projectId: project1.id,
      userId: dev1.id,
      userName: dev1.name,
      taskTitle: t2.title,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      actionText: `${dev1.name} moved Task #${t2.id} from To Do → In Progress`,
      createdAt: pastDate(1),
    },
    {
      taskId: t7.id,
      projectId: project2.id,
      userId: dev2.id,
      userName: dev2.name,
      taskTitle: t7.title,
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      actionText: `${dev2.name} moved Task #${t7.id} from In Review → Done`,
      createdAt: pastDate(3),
    },
    {
      taskId: t9.id,
      projectId: project2.id,
      userId: null,
      userName: 'System Scheduler',
      taskTitle: t9.title,
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.OVERDUE,
      actionText: `System marked Task #${t9.id} (${t9.title}) from To Do → Overdue · due date passed`,
      createdAt: pastDate(3),
    },
    {
      taskId: t10.id,
      projectId: project2.id,
      userId: dev4.id,
      userName: dev4.name,
      taskTitle: t10.title,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      actionText: `${dev4.name} moved Task #${t10.id} from In Progress → In Review`,
      createdAt: pastDate(1),
    },
    {
      taskId: t12.id,
      projectId: project3.id,
      userId: dev4.id,
      userName: dev4.name,
      taskTitle: t12.title,
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      actionText: `${dev4.name} moved Task #${t12.id} from In Review → Done`,
      createdAt: pastDate(5),
    },
    {
      taskId: t14.id,
      projectId: project3.id,
      userId: dev2.id,
      userName: dev2.name,
      taskTitle: t14.title,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      actionText: `${dev2.name} moved Task #${t14.id} from In Progress → In Review`,
      createdAt: pastDate(1),
    },
    {
      taskId: t15.id,
      projectId: project3.id,
      userId: null,
      userName: 'System Scheduler',
      taskTitle: t15.title,
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.OVERDUE,
      actionText: `System marked Task #${t15.id} (${t15.title}) from In Progress → Overdue · due date passed`,
      createdAt: pastDate(1),
    },
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log(`[Seed] Created ${activityLogs.length} pre-existing activity log entries.`);

  // 7. Initial in-app notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        taskId: t2.id,
        projectId: project1.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `Sarah Connor assigned you Task #${t2.id}: "${t2.title}"`,
        read: false,
        createdAt: pastDate(2),
      },
      {
        userId: pm1.id,
        taskId: t3.id,
        projectId: project1.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Ready for Review',
        message: `Priya Sharma moved Task #${t3.id} "${t3.title}" to In Review for project "${project1.name}".`,
        read: false,
        createdAt: pastDate(1),
      },
      {
        userId: dev3.id,
        taskId: t4.id,
        projectId: project1.id,
        type: NotificationType.TASK_OVERDUE,
        title: 'Task Overdue',
        message: `Task #${t4.id} "${t4.title}" has exceeded its due date.`,
        read: false,
        createdAt: pastDate(2),
      },
      {
        userId: pm2.id,
        taskId: t14.id,
        projectId: project3.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Ready for Review',
        message: `Priya Sharma moved Task #${t14.id} "${t14.title}" to In Review for project "${project3.name}".`,
        read: false,
        createdAt: pastDate(1),
      },
    ],
  });

  console.log('[Seed] Created initial in-app notifications.');
  console.log('[Seed] Successfully seeded all data!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
