import api from '../api';

export interface ChannelAccount {
  id: string;
  platform: 'facebook_page' | 'instagram_business' | 'whatsapp_business';
  externalId: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    conversations: number;
    campaigns: number;
  };
}

export interface CreateChannelAccountData {
  platform: 'facebook_page' | 'instagram_business' | 'whatsapp_business';
  externalId: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  status?: 'connected' | 'disconnected' | 'error';
  settings?: Record<string, any>;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'organic_post' | 'paid_ad' | 'story' | 'reel' | 'whatsapp_broadcast';
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  budget?: number;
  spend?: number;
  channelAccountId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
  updatedAt: string;
  channelAccount?: ChannelAccount;
  _count?: {
    conversations: number;
    attributions: number;
  };
}

export interface Participant {
  id: string;
  type: 'unknown' | 'lead' | 'parent' | 'school';
  platformUserId?: string;
  name?: string;
  profilePictureUrl?: string;
  phone?: string;
  email?: string;
  leadId?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  externalMessageId: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location';
  content?: string;
  mediaUrl?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  senderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  channelAccountId: string;
  platform: 'facebook_page' | 'instagram_business' | 'whatsapp_business';
  externalThreadId: string;
  participantId: string;
  status: 'new' | 'in_progress' | 'waiting_reply' | 'converted' | 'archived';
  assignedTo?: string;
  campaignId?: string;
  source?: string;
  leadId?: string;
  firstMessageAt: string;
  lastMessageAt: string;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
  channelAccount?: ChannelAccount;
  participant?: Participant;
  campaign?: Campaign;
  lead?: any;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface MarketingOverview {
  metrics: {
    totalConversations: number;
    newConversations: number;
    inProgressConversations: number;
    waitingReplyConversations: number;
    convertedConversations: number;
    totalChannels: number;
    activeCampaigns: number;
  };
  channelBreakdown: Array<{
    platform: string;
    _count: { id: number };
  }>;
  topCampaigns: Campaign[];
  recentConversations: Conversation[];
}

class MarketingService {
  // Overview
  async getOverview(): Promise<{ data: MarketingOverview }> {
    const response = await api.get('/marketing/overview');
    return response;
  }

  // Channel Accounts
  async getChannelAccounts(): Promise<{ data: ChannelAccount[] }> {
    const response = await api.get('/marketing/channel-accounts');
    return response;
  }

  async getChannelAccount(id: string): Promise<{ data: ChannelAccount }> {
    const response = await api.get(`/marketing/channel-accounts/${id}`);
    return response;
  }

  async createChannelAccount(data: CreateChannelAccountData): Promise<{ data: ChannelAccount }> {
    const response = await api.post('/marketing/channel-accounts', data);
    return response;
  }

  async updateChannelAccount(id: string, data: Partial<ChannelAccount>): Promise<{ data: ChannelAccount }> {
    const response = await api.patch(`/marketing/channel-accounts/${id}`, data);
    return response;
  }

  async deleteChannelAccount(id: string): Promise<void> {
    await api.delete(`/marketing/channel-accounts/${id}`);
  }

  // Campaigns
  async getCampaigns(): Promise<{ data: Campaign[] }> {
    const response = await api.get('/marketing/campaigns');
    return response;
  }

  async getCampaign(id: string): Promise<{ data: Campaign }> {
    const response = await api.get(`/marketing/campaigns/${id}`);
    return response;
  }

  async createCampaign(data: Partial<Campaign>): Promise<{ data: Campaign }> {
    const response = await api.post('/marketing/campaigns', data);
    return response;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<{ data: Campaign }> {
    const response = await api.patch(`/marketing/campaigns/${id}`, data);
    return response;
  }

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/marketing/campaigns/${id}`);
  }

  // Conversations
  async getConversations(query?: {
    status?: string;
    platform?: string;
    channelAccountId?: string;
    campaignId?: string;
    assignedTo?: string;
    participantId?: string;
  }): Promise<{ data: Conversation[] }> {
    const response = await api.get('/marketing/conversations', { params: query });
    return response;
  }

  async getConversation(id: string): Promise<{ data: Conversation }> {
    const response = await api.get(`/marketing/conversations/${id}`);
    return response;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<{ data: Conversation }> {
    const response = await api.patch(`/marketing/conversations/${id}`, data);
    return response;
  }

  async convertToLead(id: string, data: {
    existingLeadId?: string;
    createNewLead?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }): Promise<{ data: any }> {
    const response = await api.post(`/marketing/conversations/${id}/convert-to-lead`, data);
    return response;
  }

  // Messages
  async getMessages(conversationId: string): Promise<{ data: Message[] }> {
    const response = await api.get(`/marketing/messages/conversation/${conversationId}`);
    return response;
  }

  // Meta OAuth (Facebook Pages/Messenger)
  async getMetaOAuthUrl(redirectUri: string): Promise<{ data: { url: string } }> {
    const response = await api.get('/marketing/meta/oauth/url', { params: { redirectUri } });
    return response;
  }

  async exchangeMetaOAuth(data: {
    code: string;
    state: string;
    redirectUri: string;
  }): Promise<{ data: { connected: ChannelAccount[] } }> {
    const response = await api.post('/marketing/meta/oauth/exchange', data);
    return response;
  }

  async sendMessage(data: {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file';
    mediaUrl?: string;
  }): Promise<{ data: Message }> {
    // Generate a temporary external message ID (backend will handle actual sending)
    const externalMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response = await api.post('/marketing/messages', {
      conversationId: data.conversationId,
      externalMessageId,
      direction: 'outbound',
      type: data.type || 'text',
      content: data.content,
      mediaUrl: data.mediaUrl,
      sentAt: new Date().toISOString(),
    });
    return response;
  }

  // Participants
  async getParticipants(): Promise<{ data: Participant[] }> {
    const response = await api.get('/marketing/participants');
    return response;
  }

  async getParticipant(id: string): Promise<{ data: Participant }> {
    const response = await api.get(`/marketing/participants/${id}`);
    return response;
  }
}

export const marketingService = new MarketingService();
export default marketingService;

