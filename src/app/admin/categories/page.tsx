'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2, Plus, Search, Edit, Trash, GripVertical, Trash2, AlertTriangle } from "lucide-react";
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// 分类接口定义
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  order: number;
  createdAt: string;
  updatedAt: string | null;
  children?: Category[]; // 添加可选的子分类数组
  level?: number; // 添加可选的层级属性
}

interface SortableCategoryItemProps {
  id: number;
  children: React.ReactNode;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children}
    </div>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: null as number | null,
    order: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<number[]>([]);
  const { toast } = useToast();

  // 拖拽相关传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px的移动距离才会触发拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 本地状态，用于拖拽时的视觉反馈
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // 当 categories 变化时更新本地状态
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // 过滤分类
  const filteredCategories = localCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(Number(active.id));
  };

  // 处理拖拽结束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const activeId = Number(active.id);
      const overId = Number(over.id);

      console.log(`拖拽结束: 将分类 ${activeId} 移动到 ${overId} 位置`);

      // 找到拖拽的分类和目标分类
      const activeCategory = categories.find(c => c.id === activeId);
      const overCategory = categories.find(c => c.id === overId);

      if (!activeCategory || !overCategory) {
        console.error('找不到拖拽的分类或目标分类');
        return;
      }

      // 更新本地状态
      const oldIndex = categories.findIndex(c => c.id === activeId);
      const newIndex = categories.findIndex(c => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);

        // 更新顺序
        const updatedCategories = newCategories.map((category, index) => ({
          ...category,
          order: index + 1
        }));

        setCategories(updatedCategories);

        // 发送重新排序请求到API
        try {
          const response = await fetch('/api/categories/reorder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              activeId,
              overId
            })
          });

          if (!response.ok) {
            throw new Error('重新排序失败');
          }

          console.log('分类重新排序成功');

          // 重新获取分类列表以确保数据同步
          fetchCategories();
        } catch (error) {
          console.error('重新排序失败:', error);
          toast({
            title: "排序失败",
            description: "无法保存新的分类顺序，请刷新页面后重试",
            variant: "destructive",
          });

          // 恢复原始顺序
          setCategories(categories);
        }
      }
    }
  };

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/categories/list');

      if (!response.ok) {
        throw new Error(`获取分类列表失败 (${response.status})`);
      }

      const data = await response.json();
      console.log('获取到的分类数据:', data);

      // 确保数据是数组
      if (!Array.isArray(data)) {
        throw new Error('获取到的分类数据格式不正确');
      }

      // 按 order 字段排序
      const sortedData = [...data].sort((a, b) => a.order - b.order);

      setCategories(sortedData);
      setLocalCategories(sortedData);
      setIsLoading(false);
    } catch (error) {
      console.error('获取分类列表时出错:', error);
      setError(`获取分类列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 打开创建分类模态框
  const openCreateModal = () => {
    setNewCategory({
      name: '',
      slug: '',
      description: '',
      parentId: null,
      order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0
    });
    setIsCreateModalOpen(true);
  };

  // 打开编辑分类模态框
  const openEditModal = (category: Category) => {
    setEditingCategory({ ...category });
    setIsEditModalOpen(true);
  };

  // 打开删除确认对话框
  const openDeleteAlert = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setIsDeleteAlertOpen(true);
  };

  // 创建新分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategory.name || !newCategory.slug) {
      toast({
        title: "验证失败",
        description: "名称和别名是必填项",
        variant: "destructive",
      });
      return;
    }

    // 检查父级是否有效
    if (newCategory.parentId !== null) {
      // 检查父级是否存在
      const parentCategory = categories.find(c => c.id === newCategory.parentId);
      if (!parentCategory) {
        toast({
          title: "验证失败",
          description: "选择的父级分类不存在",
          variant: "destructive",
        });
        return;
      }

      // 检查父级链是否形成循环
      const checkCircularReference = (parentId: number, ancestorIds: number[] = []): boolean => {
        if (ancestorIds.includes(parentId)) return true;

        const parent = categories.find(c => c.id === parentId);
        if (!parent || parent.parentId === null) return false;

        return checkCircularReference(parent.parentId, [...ancestorIds, parentId]);
      };

      if (checkCircularReference(newCategory.parentId)) {
        toast({
          title: "验证失败",
          description: "选择的父级分类存在循环引用",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsCreating(true);

      // 自动生成别名（如果没有提供）
      const slug = newCategory.slug || newCategory.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCategory,
          slug
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `创建分类失败 (${response.status})`);
      }

      // 重新获取分类列表
      fetchCategories();

      // 关闭模态框并重置表单
      setIsCreateModalOpen(false);
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        parentId: null,
        order: 0
      });

      toast({
        title: "创建成功",
        description: `分类 "${newCategory.name}" 已创建`,
      });
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

    if (!editingCategory || !editingCategory.name || !editingCategory.slug) {
      toast({
        title: "验证失败",
        description: "名称和别名是必填项",
        variant: "destructive",
      });
      return;
    }

    // 检查是否存在循环引用
    if (editingCategory.parentId !== null) {
      // 检查父级是否是自己
      if (editingCategory.id === editingCategory.parentId) {
        toast({
          title: "验证失败",
          description: "分类不能将自己设为父级",
          variant: "destructive",
        });
        return;
      }

      // 递归检查父级链是否形成循环
      const checkCircularReference = (categoryId: number, parentId: number): boolean => {
        // 如果分类ID与潜在父级ID相同，则存在循环引用
        if (categoryId === parentId) return true;

        // 检查潜在父级的父级是否是当前分类
        const potentialParent = categories.find(c => c.id === parentId);
        if (!potentialParent || potentialParent.parentId === null) return false;

        // 递归检查父级链
        return checkCircularReference(categoryId, potentialParent.parentId);
      };

      if (checkCircularReference(editingCategory.id, editingCategory.parentId)) {
        toast({
          title: "验证失败",
          description: "不能将分类设为其子分类的子分类，这会造成循环引用",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsEditing(true);

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCategory),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `更新分类失败 (${response.status})`);
      }

      // 重新获取分类列表
      fetchCategories();

      // 关闭模态框
      setIsEditModalOpen(false);

      toast({
        title: "更新成功",
        description: `分类 "${editingCategory.name}" 已更新`,
      });
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
  const handleDeleteCategory = async (id: number) => {
    try {
      setIsDeleting(true);
      console.log('开始删除分类, ID:', id);

      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('删除分类响应状态:', response.status);

      // 尝试解析响应体，不管状态如何
      let errorData: { error?: string } = {};
      try {
        const responseText = await response.text();
        console.log('删除分类响应内容(原始):', responseText);

        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
            console.log('删除分类响应内容(解析):', errorData);
          } catch (jsonError) {
            console.error('JSON解析失败:', jsonError);
          }
        }
      } catch (parseError) {
        console.error('解析响应失败:', parseError);
      }

      if (!response.ok) {
        console.error('删除分类失败:', response.status, errorData);

        // 处理特定错误情况
        if (response.status === 400) {
          if (errorData.error) {
            if (errorData.error.includes('未分类')) {
              throw new Error('无法删除"未分类"分类，这是系统默认分类。');
            }

            throw new Error(errorData.error);
          }
        }

        throw new Error(`删除分类失败 (${response.status})`);
      }

      console.log('分类删除成功');

      // 重新获取分类列表
      fetchCategories();

      // 关闭确认对话框
      setIsDeleteAlertOpen(false);
      setCategoryToDelete(null);

      toast({
        title: "删除成功",
        description: "分类已删除",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err: any) {
      console.error('删除分类出错:', err);
      toast({
        title: "删除失败",
        description: err.message || "无法删除分类，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  // 将扁平分类列表转换为树形结构
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap: Record<number, Category> = {};
    const rootCategories: Category[] = [];

    // 首先创建所有分类的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // 然后构建树结构
    categories.forEach(category => {
      const categoryWithChildren = categoryMap[category.id];

      if (category.parentId === null) {
        // 这是一个顶级分类
        rootCategories.push(categoryWithChildren);
      } else {
        // 这是一个子分类，将其添加到父分类的children数组中
        const parent = categoryMap[category.parentId];
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryWithChildren);
        } else {
          // 如果找不到父分类，则作为顶级分类处理
          rootCategories.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  };

  // 计算分类树
  const categoryTree = buildCategoryTree(filteredCategories);

  // 扁平化分类树，保持层级信息
  const flattenCategoryTree = (categoryTree: Category[], level = 0): (Category & { level: number })[] => {
    return categoryTree.reduce((acc, category) => {
      const children = category.children || [];
      delete category.children;
      return [
        ...acc,
        { ...category, level },
        ...flattenCategoryTree(children, level + 1)
      ];
    }, [] as (Category & { level: number })[]);
  };

  // 切换分类折叠状态
  const toggleCategoryCollapse = (categoryId: number) => {
    setCollapsedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // 检查分类是否被折叠
  const isCategoryCollapsed = (categoryId: number) => {
    return collapsedCategories.includes(categoryId);
  };

  // 获取父分类选项
  const getParentCategoryOptions = (excludeId?: number) => {
    // 获取所有子分类ID（递归）
    const getAllChildrenIds = (parentId: number): number[] => {
      const children = categories.filter(c => c.parentId === parentId);
      return children.reduce(
        (ids, child) => [...ids, child.id, ...getAllChildrenIds(child.id)],
        [] as number[]
      );
    };

    // 检查是否存在循环引用
    const checkCircularReference = (categoryId: number, potentialParentId: number): boolean => {
      // 如果分类ID与潜在父级ID相同，则存在循环引用
      if (categoryId === potentialParentId) return true;

      // 检查潜在父级的父级是否是当前分类
      const potentialParent = categories.find(c => c.id === potentialParentId);
      if (!potentialParent || potentialParent.parentId === null) return false;

      // 递归检查父级链
      return checkCircularReference(categoryId, potentialParent.parentId);
    };

    // 过滤掉当前分类及其所有子分类，防止循环引用
    const validParentCategories = categories.filter(c => {
      // 排除自己
      if (excludeId && c.id === excludeId) return false;

      // 排除所有子分类
      if (excludeId && getAllChildrenIds(excludeId).includes(c.id)) return false;

      // 排除会导致循环引用的父级
      if (excludeId && c.parentId !== null && checkCircularReference(c.id, excludeId)) return false;

      return true;
    });

    return validParentCategories.map(category => (
      <option key={category.id} value={category.id}>
        {category.name}
        {category.level ? ' '.repeat(category.level * 2) + '↳ ' : ''}
      </option>
    ));
  };

  // 渲染分类列表项，带缩进效果
  const renderCategoryItems = (items: Category[], level = 0) => {
    return items.map((category) => (
      <React.Fragment key={category.id}>
        <SortableCategoryItem id={category.id}>
          <div
            className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 ${
              level > 0 ? 'pl-' + (level * 8 + 3) : ''
            }`}
            style={{ paddingLeft: level > 0 ? `${level * 20 + 12}px` : '12px' }}
          >
            <div className="flex items-center space-x-3">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
              <div>
                <div className="font-medium">
                  {category.name}
                  {level > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (子分类)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">/{category.slug}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openEditModal(category)}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => openDeleteAlert(category.id)}
                className="p-1 text-red-600 hover:text-red-800"
                disabled={category.slug === 'uncategorized'}
              >
                <Trash2 className={`h-4 w-4 ${category.slug === 'uncategorized' ? 'opacity-30 cursor-not-allowed' : ''}`} />
              </button>
            </div>
          </div>
        </SortableCategoryItem>

        {/* 递归渲染子分类 */}
        {category.children && category.children.length > 0 && (
          renderCategoryItems(category.children, level + 1)
        )}
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">分类管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              管理网站的分类，可以创建、编辑、删除和排序分类。拖拽分类可以调整顺序。
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={openCreateModal}
            >
              <Plus className="mr-1 h-4 w-4" />
              新建分类
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="搜索分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-500">
            共 {filteredCategories.length} 个分类
          </div>
        </div>

        <div className="mt-6 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-gray-500">加载分类中...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-gray-900 font-medium">{error}</p>
                    <button
                      onClick={fetchCategories}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      重试
                    </button>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">没有分类</h3>
                    <p className="mt-1 text-sm text-gray-500">开始创建您的第一个分类吧</p>
                    <div className="mt-6">
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                      >
                        添加分类
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <div className="flex flex-col p-4 relative">
                        {/* 拖拽指示器 - 当有分类被拖拽时显示 */}
                        {activeId && (
                          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                            <div className="border-2 border-blue-500 border-dashed rounded-lg absolute inset-0 opacity-50"></div>
                          </div>
                        )}

                        <SortableContext
                          items={filteredCategories.map(category => category.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="divide-y divide-gray-200">
                            {renderCategoryItems(categoryTree)}
                          </div>
                        </SortableContext>
                      </div>
                    </DndContext>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 创建分类模态框 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建新分类</DialogTitle>
            <DialogDescription>
              填写以下信息创建一个新的分类。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => handleCreateCategory(e)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  名称
                </label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      name: e.target.value
                    });
                  }}
                  onBlur={(e) => {
                    if (!newCategory.slug) {
                      setNewCategory({
                        ...newCategory,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^\w\-]+/g, '')
                          .replace(/\-\-+/g, '-')
                          .replace(/^-+/, '')
                          .replace(/-+$/, ''),
                      });
                    }
                  }}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="slug" className="text-right">
                  别名
                </label>
                <Input
                  id="slug"
                  value={newCategory.slug}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      slug: e.target.value
                    });
                  }}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  描述
                </label>
                <Textarea
                  id="description"
                  value={newCategory.description || ''}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value
                    });
                  }}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="parentId" className="text-right">
                  父分类
                </label>
                <select
                  id="parentId"
                  value={newCategory.parentId === null ? '' : newCategory.parentId}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      parentId: e.target.value ? Number(e.target.value) : null
                    });
                  }}
                  className="col-span-3 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">无（顶级分类）</option>
                  {getParentCategoryOptions()}
                </select>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => setIsCreateModalOpen(false)}
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-blue-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : '创建'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑分类模态框 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改分类信息。
            </DialogDescription>
          </DialogHeader>

          {editingCategory && (
            <form onSubmit={(e) => handleUpdateCategory(e)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-name" className="text-right">
                    名称
                  </label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => {
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value
                      });
                    }}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-slug" className="text-right">
                    别名
                  </label>
                  <Input
                    id="edit-slug"
                    value={editingCategory.slug}
                    onChange={(e) => {
                      setEditingCategory({
                        ...editingCategory,
                        slug: e.target.value
                      });
                    }}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-description" className="text-right">
                    描述
                  </label>
                  <Textarea
                    id="edit-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => {
                      setEditingCategory({
                        ...editingCategory,
                        description: e.target.value
                      });
                    }}
                    className="col-span-3"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="edit-parentId" className="text-right">
                    父分类
                  </label>
                  <select
                    id="edit-parentId"
                    value={editingCategory.parentId === null ? '' : editingCategory.parentId}
                    onChange={(e) => {
                      setEditingCategory({
                        ...editingCategory,
                        parentId: e.target.value ? Number(e.target.value) : null
                      });
                    }}
                    className="col-span-3 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">无（顶级分类）</option>
                    {getParentCategoryOptions(editingCategory.id)}
                  </select>
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : '保存'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除分类确认框 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个分类吗？此操作无法撤销，且可能会影响到使用此分类的文章。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete !== null && handleDeleteCategory(categoryToDelete)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
