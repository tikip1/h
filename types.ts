export type SocialPlatform = 'Instagram' | 'X (Twitter)' | 'LinkedIn' | 'Facebook' | 'TikTok';

export type Tone = 'Casual' | 'Professional' | 'Witty' | 'Enthusiastic' | 'Formal';

export type GenerationTarget = 'Both' | 'Captions only' | 'Hashtags only';

export interface AdvancedOptions {
  numCaptions: number;
  numHashtags: number;
  tone: Tone;
  includeEmojis: boolean;
  generationTarget: GenerationTarget;
}

export interface GeneratedContent {
  captions: string[];
  hashtags: string[];
}
