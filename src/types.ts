// src/types.ts

export interface Article {
  title: string;
  link: string;
  source: string;
  summary: string;
  impact: 'Low' | 'Medium' | 'High';
}
