import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Note: In production, use SMS Misr API

@Injectable()
export class SmsService {
  constructor(private configService: ConfigService) {}

  async send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ) {
    // TODO: Implement SMS Misr API integration
    // For now, just log
    console.log('SMS Service:', {
      to,
      message,
      template,
      payload,
    });

    // Example SMS Misr implementation:
    // const apiKey = this.configService.get('SMS_MISR_API_KEY');
    // const senderId = this.configService.get('SMS_MISR_SENDER_ID');
    //
    // const response = await fetch('https://smsmisr.com/api/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`,
    //   },
    //   body: JSON.stringify({
    //     sender: senderId,
    //     mobile: to,
    //     message: message,
    //   }),
    // });
    //
    // return await response.json();

    return { success: true, messageId: 'mock-sms-id' };
  }
}

