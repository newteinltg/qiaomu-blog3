import Link from 'next/link';
import Image from 'next/image';
import { HeroSetting } from '@/lib/schema';

type HeroSectionProps = {
  title: string;
  subtitle: string;
  backgroundImage?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  hero?: HeroSetting | null;
};

const HeroSection = ({
  title = '向阳乔木的个人博客',
  subtitle = '分享技术、生活和思考',
  backgroundImage = null,
  buttonText = '了解更多',
  buttonUrl = '/about',
  hero = null
}: HeroSectionProps) => {
  return (
    <section className="hero bg-gray-50 dark:bg-gray-800 py-12 relative overflow-hidden">
      {/* 圆形背景动画 */}
      <div className="hero-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hero-content relative z-10 text-center py-8">
          {/* 背景图片 */}
          {backgroundImage && (
            <div className="hero-bg absolute inset-0 -z-10">
              <Image
                src={backgroundImage}
                alt="Hero Background"
                fill
                priority
                className="object-cover"
              />
              <div className="hero-overlay absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
          )}

          <div className="hero-text">
            <h1 className="hero-title text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-primary-600 dark:from-white dark:to-primary-400 text-transparent bg-clip-text">
              {title}
            </h1>
            <p className="hero-subtitle text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              {subtitle}
            </p>
            <div className="hero-buttons flex flex-wrap justify-center gap-4">
              <Link
                href={buttonUrl || '/about'}
                className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-transform hover:-translate-y-1"
              >
                {buttonText || '了解更多'}
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
              <Link
                href="/contact"
                className="btn-outline inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:-translate-y-1"
              >
                联系我
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
