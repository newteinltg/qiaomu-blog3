'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type MobileMenuProps = {
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  isOpen: boolean;
};

const MobileMenu = ({ categories, isOpen }: MobileMenuProps) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  
  return (
    <div className={`mobile-menu md:hidden ${isOpen ? 'active' : ''}`}>
      <nav className="flex flex-col space-y-4 p-4">
        <Link href="/" className="mobile-nav-link py-2">首页</Link>
        
        <div className="mobile-dropdown-container">
          <button 
            className="mobile-dropdown-toggle flex items-center justify-between w-full py-2"
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          >
            <span>分类</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 mobile-dropdown-icon ${isCategoriesOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`mobile-dropdown pl-4 ${isCategoriesOpen ? 'active' : ''}`}>
            {categories.map(category => (
              <Link 
                key={category.id} 
                href={`/categories/${category.slug}`} 
                className="block py-2"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        
        <button id="mobileThemeToggle" className="py-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mobile-theme-light" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mobile-theme-dark hidden" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
          切换主题
        </button>
      </nav>
    </div>
  );
};

export default MobileMenu;
