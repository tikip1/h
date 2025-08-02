export interface GeneratedContent {
  title: string;
  tags: string[];
}

export interface ProcessableImage {
  id: string;
  filename: string;
  dataUrl: string;
  base64: string;
}

export type ProcessResult = 
  | GeneratedContent 
  | { status: 'loading' }
  | { status: 'error'; message: string };