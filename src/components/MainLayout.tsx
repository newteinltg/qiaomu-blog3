'use client';

import { ReactNode, useEffect, useState } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import { usePathname } from 'next/navigation';
import { SocialLink, ContactInfo, DonationInfo } from '@/lib/schema';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [donationInfo, setDonationInfo] = useState<DonationInfo[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 获取网站设置
  useEffect(() => {
    if (!isAdminPage) {
      const fetchSettings = async () => {
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setSocialLinks(data.data.socialLinks || []);
              setContactInfo(data.data.contactInfo || []);
              setDonationInfo(data.data.donationInfo || []);
              setSiteSettings(data.data.settings || {});
            }
          }
        } catch (error) {
          console.error('获取网站设置失败:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSettings();
    }
  }, [isAdminPage]);

  // 不在管理页面中渲染此布局
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation
        siteTitle={siteSettings.site_name || '向阳乔木的个人博客'}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer
        socialLinks={socialLinks}
        contactInfo={contactInfo}
        donationInfo={donationInfo}
        siteTitle={siteSettings.site_name || '向阳乔木'}
        siteDescription={siteSettings.site_description || '分享技术、生活和思考，记录成长的点滴。'}
        footerLinks={siteSettings.footer_links ? JSON.parse(siteSettings.footer_links) : []}
      />
    </div>
  );
}
