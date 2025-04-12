'use client';

import { useState, useEffect } from 'react';

interface Settings {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string;
  siteUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  contactQrCode?: string;
  rewardQrCode?: string;
  footerText?: string;
  footerLinks?: Array<{ name: string; url: string }>;
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await fetch('/api/settings/general');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
