/**
 * 菜单适配器工具函数
 * 用于将数据库菜单转换为组件期望的格式
 */

// SimpleNavigation组件期望的MenuItem类型
export type MenuItem = {
  id: number;
  name: string;
  url: string; // 非空字符串
  isExternal: number;
  parentId: number | null;
  order: number;
  isActive: number;
};

/**
 * 适配器函数：将数据库菜单转换为SimpleNavigation期望的格式
 * @param menus 数据库菜单数组
 * @returns 转换后的菜单数组
 */
export function adaptMenus(menus: any[]): MenuItem[] {
  return menus.map(menu => ({
    ...menu,
    url: menu.url || '#' // 确保url永远不为null
  }));
}
