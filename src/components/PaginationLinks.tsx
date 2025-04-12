'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationLinksProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function PaginationLinks({ currentPage, totalPages, basePath }: PaginationLinksProps) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // 最多显示的页码数量
    
    if (totalPages <= maxPagesToShow) {
      // 如果总页数小于等于最大显示数，则显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 否则，显示当前页附近的页码
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // 添加首页和尾页的省略号
      if (startPage > 1) {
        pageNumbers.unshift(1);
        if (startPage > 2) pageNumbers.splice(1, 0, -1); // -1 表示省略号
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push(-1); // -1 表示省略号
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  // 构建带有页码的URL
  const getPageUrl = (page: number) => {
    return `${basePath}${page > 1 ? `?page=${page}` : ''}`;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Link href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'} passHref>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">上一页</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>
      
      {getPageNumbers().map((pageNumber, index) => (
        pageNumber === -1 ? (
          <span key={`ellipsis-${index}`} className="px-2">...</span>
        ) : (
          <Link key={pageNumber} href={getPageUrl(pageNumber)} passHref>
            <Button
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </Button>
          </Link>
        )
      ))}
      
      <Link href={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'} passHref>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">下一页</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
