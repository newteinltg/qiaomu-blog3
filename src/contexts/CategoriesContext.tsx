'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// 分类接口定义
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  level: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // 搜索相关
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // 创建分类相关
  newCategory: Partial<Category>;
  setNewCategory: (category: Partial<Category>) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  isCreating: boolean;
  
  // 编辑分类相关
  editingCategory: Category | null;
  setEditingCategory: React.Dispatch<React.SetStateAction<Category | null>>;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (isOpen: boolean) => void;
  isEditing: boolean;
  
  // 删除分类相关
  categoryToDelete: Category | null;
  isDeleteAlertOpen: boolean;
  setIsDeleteAlertOpen: (isOpen: boolean) => void;
  isDeleting: boolean;
  
  // 拖拽排序相关
  activeId: number | null;
  setActiveId: (id: number | null) => void;
  overId: number | null;
  setOverId: (id: number | null) => void;
  dragDepth: number;
  setDragDepth: (depth: number) => void;
  
  // 折叠/展开相关
  collapsedCategories: number[];
  toggleCategoryCollapse: (categoryId: number) => void;
  isCategoryCollapsed: (categoryId: number) => boolean;
  
  // 操作函数
  fetchCategories: () => Promise<void>;
  openCreateModal: () => void;
  openEditModal: (category: Category) => void;
  openDeleteAlert: (category: Category) => void;
  handleCreateCategory: (e: React.FormEvent) => Promise<void>;
  handleUpdateCategory: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (category: Category) => Promise<void>;
  handleDragEnd: (event: any) => Promise<void>;
  getCategoryChildren: (categoryId: number) => Category[];
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  
  // 创建分类相关状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parentId: null
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // 编辑分类相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 删除分类相关状态
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 拖拽排序相关状态
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [dragDepth, setDragDepth] = useState<number>(0); // 拖拽时的缩进深度
  
  // 折叠/展开状态
  const [collapsedCategories, setCollapsedCategories] = useState<number[]>([]);
  
  const { toast } = useToast();
  
  // 在组件初始化时获取分类数据
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // 获取所有分类
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error(`获取分类列表失败 (${response.status})`);
      }
      
      const data = await response.json();
      
      // 处理分类的层级结构
      const processedCategories = processCategories(data);
      setCategories(processedCategories);
    } catch (err: any) {
      console.error('获取分类列表出错:', err);
      setError(err.message || '无法加载分类数据，请稍后再试');
      toast({
        title: "加载失败",
        description: err.message || "无法加载分类数据，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理分类的层级结构
  const processCategories = (categories: Category[]): Category[] => {
    // 创建一个副本，避免修改原始数据
    const allCategories = [...categories];
    
    // 按照 order 排序
    allCategories.sort((a, b) => a.order - b.order);
    
    // 计算每个分类是否有子分类
    const childrenCount = new Map<number, number>();
    allCategories.forEach(category => {
      if (category.parentId !== null) {
        const count = childrenCount.get(category.parentId) || 0;
        childrenCount.set(category.parentId, count + 1);
      }
    });
    
    // 为每个分类添加层级信息和子分类标记
    const processedCategories = allCategories.map(category => {
      // 检查是否有子分类
      const hasChildren = (childrenCount.get(category.id) || 0) > 0;
      
      // 如果是顶级分类
      if (category.parentId === null) {
        return { ...category, level: 0, hasChildren };
      }
      
      // 查找父分类
      const parentCategory = allCategories.find(c => c.id === category.parentId);
      
      // 如果找不到父分类，或者父分类是自己，则当作顶级分类处理
      if (!parentCategory || parentCategory.id === category.id) {
        return { ...category, level: 0, hasChildren };
      }
      
      // 计算层级
      let level = 1;
      let currentParentId: number | null = parentCategory.parentId;
      
      // 向上查找祖先分类，计算层级深度
      while (currentParentId !== null) {
        const ancestor = allCategories.find(c => c.id === currentParentId);
        if (!ancestor || ancestor.id === currentParentId) break;
        level++;
        currentParentId = ancestor.parentId;
      }
      
      return { ...category, level, hasChildren };
    });
    
    // 过滤掉被折叠的分类的子分类
    const visibleCategories = processedCategories.filter(category => {
      if (category.parentId === null) return true;
      
      // 检查所有祖先分类是否有被折叠的
      let currentParentId: number | null = category.parentId;
      while (currentParentId !== null) {
        if (collapsedCategories.includes(currentParentId)) {
          return false;
        }
        
        const parent = processedCategories.find(c => c.id === currentParentId);
        if (!parent) break;
        
        currentParentId = parent.parentId;
      }
      
      return true;
    });
    
    return visibleCategories;
  };

  // 获取分类的子分类
  const getCategoryChildren = (categoryId: number): Category[] => {
    return categories.filter(category => category.parentId === categoryId);
  };
  
  // 切换分类的折叠状态
  const toggleCategoryCollapse = (id: number) => {
    setCollapsedCategories(prev => {
      if (prev.includes(id)) {
        return prev.filter(categoryId => categoryId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // 检查分类是否被折叠
  const isCategoryCollapsed = (id: number): boolean => {
    return collapsedCategories.includes(id);
  };

  // 生成别名
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // 打开创建分类模态框
  const openCreateModal = () => {
    setNewCategory({
      name: '',
      slug: '',
      description: '',
      parentId: null
    });
    setIsCreateModalOpen(true);
  };

  // 打开编辑分类模态框
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  // 打开删除确认框
  const openDeleteAlert = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteAlertOpen(true);
  };

  // 创建新分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name?.trim() || !newCategory.slug?.trim()) {
      toast({
        title: "错误",
        description: "分类名称和别名不能为空",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      const categoryData = {
        name: newCategory.name.trim(),
        slug: newCategory.slug.trim(),
        description: newCategory.description?.trim() || null,
        parentId: newCategory.parentId
      };
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        throw new Error('创建分类失败');
      }
      
      toast({
        title: "创建成功",
        description: "分类已成功创建",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        parentId: null
      });
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('创建分类出错:', err);
      toast({
        title: "创建失败",
        description: err.message || "无法创建分类，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // 更新分类
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.slug.trim()) {
      toast({
        title: "错误",
        description: "分类名称和别名不能为空",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsEditing(true);
      
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editingCategory.name.trim(),
          slug: editingCategory.slug.trim(),
          description: editingCategory.description?.trim() || null,
          parentId: editingCategory.parentId
        }),
      });
      
      if (!response.ok) {
        throw new Error('更新分类失败');
      }
      
      toast({
        title: "更新成功",
        description: "分类已成功更新",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setIsEditModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('更新分类出错:', err);
      toast({
        title: "更新失败",
        description: err.message || "无法更新分类，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (category: Category) => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/categories?id=${category.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除分类失败');
      }
      
      toast({
        title: "删除成功",
        description: "分类已成功删除",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setIsDeleteAlertOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('删除分类出错:', err);
      toast({
        title: "删除失败",
        description: err.message || "无法删除分类，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理拖拽结束事件
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = Number(active.id);
    const overId = Number(over.id);
    
    if (activeId === overId) return;
    
    // 检查是否是拖拽到自己的子分类上（避免循环引用）
    if (isChildOf(overId, activeId, categories)) {
      toast({
        title: "操作无效",
        description: "不能将分类移动到其子分类中",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // 调用 API 更新分类顺序
      const response = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeId,
          overId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '更新分类顺序失败' }));
        throw new Error(errorData.error || '更新分类顺序失败');
      }
      
      toast({
        title: "排序更新成功",
        description: "分类顺序已更新",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // 重新获取分类列表
      await fetchCategories();
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      toast({
        title: "排序更新失败",
        description: error.message || "无法更新分类顺序，请稍后再试",
        variant: "destructive",
      });
    }
  };
  
  // 检查一个分类是否是另一个分类的子分类
  const isChildOf = (childId: number, parentId: number, categoriesList: Category[]): boolean => {
    const child = categoriesList.find(c => c.id === childId);
    if (!child || child.parentId === null) return false;
    if (child.parentId === parentId) return true;
    return isChildOf(child.parentId, parentId, categoriesList);
  };

  const value = {
    categories,
    isLoading,
    error,
    
    // 搜索相关
    searchQuery,
    setSearchQuery,
    
    // 创建分类相关
    newCategory,
    setNewCategory,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    
    // 编辑分类相关
    editingCategory,
    setEditingCategory,
    isEditModalOpen,
    setIsEditModalOpen,
    isEditing,
    
    // 删除分类相关
    categoryToDelete,
    isDeleteAlertOpen,
    setIsDeleteAlertOpen,
    isDeleting,
    
    // 拖拽排序相关
    activeId,
    setActiveId,
    overId,
    setOverId,
    dragDepth,
    setDragDepth,
    
    // 折叠/展开相关
    collapsedCategories,
    toggleCategoryCollapse,
    isCategoryCollapsed,
    
    // 操作函数
    fetchCategories,
    openCreateModal,
    openEditModal,
    openDeleteAlert,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleDragEnd,
    getCategoryChildren,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return context;
}
