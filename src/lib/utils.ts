/**
 * Utility functions for the blog application
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import pinyin from 'pinyin';

/**
 * Combines class names with tailwind-merge for optimal class generation
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-friendly slug from a string
 * Converts Chinese characters to pinyin and limits to 20 characters
 * 
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  // 检测是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  
  // 如果包含中文，转换为拼音
  let processedText = text;
  if (hasChinese) {
    processedText = pinyin(text, {
      style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
      heteronym: false, // 禁用多音字
    }).join('');
  }
  
  return processedText
    .toLowerCase()
    .replace(/[^\w]+/g, '-') // 将非单词字符替换为连字符
    .replace(/^-+|-+$/g, '') // 删除开头和结尾的连字符
    .substring(0, 20); // 限制长度为20个字符
}

/**
 * 格式化日期为中文友好格式
 * 
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串，例如：2025年4月5日
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // 中文日期格式
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
