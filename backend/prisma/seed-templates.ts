import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log('Seeding message templates...');

  const templates = [
    // Payment Due Reminder (SMS)
    {
      channel: 'sms',
      key: 'payment_due_reminder',
      name: 'Payment Due Reminder (SMS)',
      subject: null,
      body: 'Reminder: Payment of EGP {{amount}} for {{studentName}} is due in {{days}} day(s). Please settle your payment to avoid service interruption.',
      isActive: true,
    },
    // Payment Due Reminder (Email)
    {
      channel: 'email',
      key: 'payment_due_reminder',
      name: 'Payment Due Reminder (Email)',
      subject: 'Payment Due Reminder - MV-OS',
      body: '<p>Dear Parent,</p><p>This is a reminder that a payment of <strong>EGP {{amount}}</strong> for <strong>{{studentName}}</strong> is due in <strong>{{days}}</strong> day(s).</p><p>Please settle your payment to avoid service interruption.</p><p>Thank you,<br>MV-OS Team</p>',
      isActive: true,
    },
    // Payment Overdue (SMS)
    {
      channel: 'sms',
      key: 'payment_overdue',
      name: 'Payment Overdue (SMS)',
      subject: null,
      body: 'URGENT: Payment of EGP {{amount}} for {{studentName}} is {{days}} day(s) overdue. Please settle immediately to avoid service suspension.',
      isActive: true,
    },
    // Payment Overdue (Email)
    {
      channel: 'email',
      key: 'payment_overdue',
      name: 'Payment Overdue (Email)',
      subject: 'URGENT: Payment Overdue - MV-OS',
      body: '<p>Dear Parent,</p><p><strong>URGENT:</strong> A payment of <strong>EGP {{amount}}</strong> for <strong>{{studentName}}</strong> is <strong>{{days}}</strong> day(s) overdue.</p><p>Please settle your payment immediately to avoid service suspension.</p><p>Thank you,<br>MV-OS Team</p>',
      isActive: true,
    },
    // Session Reminder (SMS)
    {
      channel: 'sms',
      key: 'session_reminder',
      name: 'Session Reminder (SMS)',
      subject: null,
      body: 'Reminder: {{studentName}} has class "{{className}}" tomorrow at {{time}} ({{location}}). See you there!',
      isActive: true,
    },
    // Session Reminder (Email)
    {
      channel: 'email',
      key: 'session_reminder',
      name: 'Session Reminder (Email)',
      subject: 'Class Reminder: {{className}}',
      body: '<p>Dear Parent,</p><p>This is a reminder that <strong>{{studentName}}</strong> has class <strong>"{{className}}"</strong> tomorrow at <strong>{{time}}</strong>.</p><p><strong>Location:</strong> {{location}}</p><p>We look forward to seeing you!</p><p>Thank you,<br>MV-OS Team</p>',
      isActive: true,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: {
        channel: template.channel,
        key: template.key,
      },
    });

    if (existing) {
      console.log(`Template ${template.channel}:${template.key} already exists, skipping...`);
      continue;
    }

    await prisma.messageTemplate.create({
      data: template,
    });

    console.log(`Created template: ${template.channel}:${template.key}`);
  }

  console.log('Message templates seeded successfully!');
}

seedTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






