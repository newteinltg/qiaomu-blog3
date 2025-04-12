'use client';

import React, { useState, useCallback, useEffect, useContext, memo } from 'react';
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
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2, Search, Edit, Trash, GripVertical, AlertTriangle, ExternalLink, Link, ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";

// 菜单类型定义
interface Menu {
  id: number;
  name: string;
  description: string;
  url: string;
  isExternal: number;
  parentId: number | null;
  order: number;
  isActive: number;
  createdAt: string;
  updatedAt: string | null;
}

// 带子菜单的菜单类型
interface MenuWithChildren extends Menu {
  children: MenuWithChildren[];
}

// 带层级的菜单类型
interface MenuWithLevel extends Menu {
  level: number;
  hasChildren?: boolean;
  children?: MenuWithChildren[]; // 可选的子菜单数组
  type?: 'internal' | 'external'; // 兼容性字段
}

// 菜单树节点
interface MenuTreeItem extends Menu {
  children: MenuTreeItem[];
}

interface SortableMenuItemProps {
  id: number;
  menu: MenuWithLevel;
  children: React.ReactNode;
}

// 简化的SortableMenuItem组件
const SortableMenuItem: React.FC<SortableMenuItemProps> = ({ id, menu, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'menu',
      menu
    }
  });

  // 获取拖拽指示器上下文
  const { dropIndicator } = useContext(MenuContext);

  // 判断当前项是否是拖拽目标
  const isDropTarget = dropIndicator?.id === id;

  // 只在拖拽结束时应用transform，在拖拽过程中保持原位置
  const style = {
    // 如果正在拖拽，则不应用transform，保持原位置
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.4 : 1 // 降低正在拖拽项的不透明度，但不完全隐藏
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-id={id}
      className="relative"
      {...attributes}
    >
      {/* 拖拽指示器 */}
      {isDropTarget && dropIndicator && (
        <DropIndicatorComponent dropIndicator={dropIndicator} />
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            dragHandleProps: listeners,
            isDragging: isDragging // 传递isDragging属性
          })
        : children}
    </div>
  );
};

// 定义拖拽指示器类型
interface DropIndicator {
  id: string | number;
  type: 'before' | 'after' | 'inside' | 'root';
  position: 'before' | 'after' | 'inside' | 'root';
  indentLevel?: number;
  isChildIndicator?: boolean; // 新增：标记是否显示子菜单指示器
}

// 创建菜单上下文
const MenuContext = React.createContext<{
  dropIndicator: DropIndicator | null;
  setDropIndicator: React.Dispatch<React.SetStateAction<DropIndicator | null>>;
}>({
  dropIndicator: null,
  setDropIndicator: () => {},
});

// 根区域组件
const RootDropArea: React.FC = () => {
  const { dropIndicator } = useContext(MenuContext);
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-drop-area',
    data: {
      type: 'root'
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        mt-4 mb-4 p-4 border-2 border-dashed rounded-md
        ${isOver ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'}
        ${dropIndicator?.id === 'root-drop-area' ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="text-center text-muted-foreground">
        拖拽菜单到此处成为顶级菜单
      </div>
    </div>
  );
};

// 拖拽指示器组件
const DropIndicatorComponent = memo(({ dropIndicator }: { dropIndicator: DropIndicator | null }) => {
  if (!dropIndicator) return null;

  // 根区域指示器
  if (dropIndicator.type === 'root') {
    return (
      <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-30 rounded-md flex items-center justify-center">
        <div className="bg-blue-100 px-3 py-1 rounded-md text-blue-700 font-medium shadow-sm">
          放置为顶级菜单
        </div>
      </div>
    );
  }

  // 子菜单指示器
  if (dropIndicator.isChildIndicator) {
    return (
      <div className="absolute inset-0 border-2 border-blue-500 bg-blue-50 bg-opacity-50 rounded-md flex items-center justify-center z-10">
        <div className="bg-blue-100 px-3 py-1 rounded-md text-blue-700 font-medium shadow-sm flex items-center">
          <ChevronRight className="mr-1 h-4 w-4" />
          成为子菜单
        </div>
      </div>
    );
  }

  // 普通排序指示器（前/后）
  const isBeforeIndicator = dropIndicator.position === 'before';
  return (
    <div
      className={`absolute left-0 right-0 h-1 bg-blue-500 ${isBeforeIndicator ? 'top-0' : 'bottom-0'}`}
      style={{
        marginLeft: dropIndicator.indentLevel ? `${dropIndicator.indentLevel * 24}px` : '0'
      }}
    />
  );
});

export default function MenusPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [flattenedMenus, setFlattenedMenus] = useState<MenuWithLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{x: number, startX?: number} | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

  // 增删改查状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<number | null>(null);

  // 新菜单表单状态
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    url: '',
    isExternal: false,
    isActive: true,
    parentId: '',
    order: 0
  });

  // 编辑菜单表单状态
  const [editMenu, setEditMenu] = useState({
    id: 0,
    name: '',
    description: '',
    url: '',
    isExternal: false,
    isActive: true,
    parentId: '',
    order: 0
  });

  // DnD 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 判断是否有子菜单
  const hasChildMenus = useCallback((menuId: number): boolean => {
    return menus.some(menu => menu.parentId === menuId);
  }, [menus]);

  // 处理菜单数据，创建树形结构并添加层级信息
  const processMenus = useCallback((menus: Menu[]): MenuWithLevel[] => {
    // 创建菜单树
    const createMenuTree = (items: Menu[], parentId: number | null = null): MenuWithChildren[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => {
          const children = createMenuTree(items, item.id);
          return {
            ...item,
            children
          };
        });
    };

    // 扁平化菜单树，添加层级信息
    const flattenMenuTree = (menuTree: MenuWithChildren[], level = 0, result: MenuWithLevel[] = []): MenuWithLevel[] => {
      menuTree.forEach(menu => {
        const menuWithLevel: MenuWithLevel = {
          ...menu,
          level,
          hasChildren: menu.children.length > 0,
          // 添加type字段以兼容UI组件
          type: menu.isExternal === 1 ? 'external' : 'internal',
          children: undefined // 移除children属性，避免在UI组件中传递不必要的数据
        };
        result.push(menuWithLevel);

        if (menu.children.length > 0) {
          flattenMenuTree(menu.children, level + 1, result);
        }
      });

      return result;
    };

    const menuTree = createMenuTree(menus);
    return flattenMenuTree(menuTree);
  }, []);

  // 获取菜单列表
  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 获取当前窗口的 URL
      const baseUrl = window.location.origin;
      console.log('正在获取菜单数据，请求URL:', `${baseUrl}/api/menus`);

      const response = await fetch(`${baseUrl}/api/menus`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        console.error('获取菜单失败:', response.status, response.statusText);
        const errorText = await response.text().catch(() => '无法获取错误详情');
        console.error('错误详情:', errorText);
        throw new Error(`获取菜单失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('成功获取菜单数据:', data);
      setMenus(data);
      setFlattenedMenus(processMenus(data));
    } catch (err) {
      console.error('获取菜单出错:', err);
      setError(err instanceof Error ? err.message : '获取菜单时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [processMenus]);

  // 初始化加载
  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setIsDragging(true);

    // 初始化拖拽偏移量为0
    setDragOffset({ x: 0, startX: 0 });

    console.log('拖拽开始 - 初始化偏移量为0');
  };

  // 处理拖拽取消事件
  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDropIndicator(null);
    setDragOffset(null);
    setIsDragging(false);

    console.log('拖拽取消，重置所有状态');
  };

  // 处理拖拽经过
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !dragOffset) return;

    setOverId(over.id);

    // 获取当前鼠标位置 - 使用delta.x来计算水平偏移
    // delta是相对于拖拽开始位置的偏移量，更可靠
    const { delta } = event;
    const horizontalOffset = delta.x; // 直接使用delta.x作为水平偏移量

    setDragOffset({ ...dragOffset, x: horizontalOffset });

    console.log('拖拽中 - 水平偏移:', horizontalOffset, 'px');

    // 水平方向阈值 - 20px
    const horizontalThreshold = 20;

    // 如果拖拽到了根区域
    if (over.id === 'root-drop-area') {
      setDropIndicator({
        id: 'root-drop-area',
        type: 'root',
        position: 'root'
      });
      return;
    }

    // 如果拖拽到了菜单项上且不是自己
    if (active.id !== over.id) {
      const activeMenu = active.data.current?.menu as MenuWithLevel;
      const overMenu = flattenedMenus.find(m => m.id === Number(over.id));

      if (!activeMenu || !overMenu) return;

      // 使用delta.x判断是否进入子菜单模式
      const shouldBeChildMenu = horizontalOffset > horizontalThreshold;

      // 设置拖拽指示器
      setDropIndicator({
        id: over.id,
        type: shouldBeChildMenu ? 'inside' : 'after',
        position: shouldBeChildMenu ? 'inside' : 'after',
        indentLevel: overMenu.level,
        isChildIndicator: shouldBeChildMenu
      });

      console.log(shouldBeChildMenu ? '判断为子菜单模式 - 可以上下移动选择目标父菜单' : '判断为普通排序模式');
      console.log('当前水平偏移:', horizontalOffset, 'px, 阈值:', horizontalThreshold, 'px');
    }
  };

  // 处理拖拽结束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // 保存当前偏移量用于API调用
    const finalOffset = dragOffset?.x || 0;
    const horizontalThreshold = 20;

    console.log('拖拽结束 - 最终水平偏移:', finalOffset, 'px');

    // 重置状态
    setActiveId(null);
    setOverId(null);
    setDropIndicator(null);
    setIsDragging(false);

    if (!over || !dragOffset) {
      setDragOffset(null);
      return;
    }

    if (active.id !== over.id) {
      setIsLoading(true);

      try {
        const activeId = Number(active.id);
        const baseUrl = window.location.origin;

        // 判断是否应该成为子菜单 - 基于水平偏移量
        const shouldBeChildMenu = finalOffset > horizontalThreshold;

        // 拖拽到根区域
        if (over.id === 'root-drop-area') {
          console.log('拖拽到根区域 - 移动到根级菜单');

          const response = await fetch(`${baseUrl}/api/menus/reorder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              activeId: activeId,
              overId: null,
              newParentId: null,
              position: 'root'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误:', errorText);
            throw new Error(`重新排序菜单失败: ${errorText}`);
          }

          await response.json();
          fetchMenus();
        } else {
          // 拖拽到了其他菜单上
          const targetId = Number(over.id);

          // 根据水平偏移决定操作类型
          let position: 'before' | 'after' | 'inside';
          let parentId: number | null = null;

          if (shouldBeChildMenu) {
            // 如果水平偏移超过阈值，则成为子菜单
            // 先右拖拽再上下移动的模式
            position = 'inside';
            parentId = targetId;
            console.log('执行成为子菜单操作 - 目标菜单ID:', targetId);
          } else {
            // 纯上下拖拽模式 - 执行普通排序
            position = 'after';
            const overMenu = flattenedMenus.find(m => m.id === targetId);
            parentId = overMenu?.parentId || null;
            console.log('执行普通排序操作 - 放在菜单后面');
          }

          console.log('发送API请求:', {
            activeId,
            overId: targetId,
            newParentId: parentId,
            position
          });

          const response = await fetch(`${baseUrl}/api/menus/reorder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              activeId: activeId,
              overId: targetId,
              newParentId: parentId,
              position
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误:', errorText);
            throw new Error(`重新排序菜单失败: ${errorText}`);
          }

          await response.json();
          fetchMenus();
        }
      } catch (error) {
        console.error('拖拽排序出错:', error);
        toast({
          title: '操作失败',
          description: error instanceof Error ? error.message : '未知错误',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
        setDragOffset(null);
      }
    } else {
      setDragOffset(null);
    }
  };

  // 打开创建菜单模态框
  const handleOpenCreateModal = () => {
    setNewMenu({
      name: '',
      description: '',
      url: '',
      isExternal: false,
      isActive: true,
      parentId: '',
      order: menus.length // 默认排序为当前菜单数量
    });
    setIsCreateModalOpen(true);
  };

  // 处理创建菜单表单变化
  const handleCreateMenuChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewMenu(prev => ({ ...prev, [id]: checked }));
    } else {
      setNewMenu(prev => ({ ...prev, [id]: value }));
    }
  };

  // 提交创建菜单表单
  const handleCreateMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMenu.name,
          description: newMenu.description,
          url: newMenu.url,
          isExternal: newMenu.isExternal ? 1 : 0,
          isActive: newMenu.isActive ? 1 : 0,
          parentId: newMenu.parentId ? Number(newMenu.parentId) : null,
          order: Number(newMenu.order)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`创建菜单失败: ${errorText}`);
      }

      await response.json();
      toast({
        title: '成功',
        description: '菜单创建成功',
      });
      setIsCreateModalOpen(false);
      fetchMenus(); // 重新获取菜单列表
    } catch (error) {
      console.error('创建菜单出错:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开编辑菜单模态框
  const handleOpenEditModal = (menu: Menu) => {
    setCurrentMenu(menu);
    setEditMenu({
      id: menu.id,
      name: menu.name,
      description: menu.description || '',
      url: menu.url || '',
      isExternal: menu.isExternal === 1,
      isActive: menu.isActive === 1,
      parentId: menu.parentId ? String(menu.parentId) : '',
      order: menu.order
    });
    setIsEditModalOpen(true);
  };

  // 处理编辑菜单表单变化
  const handleEditMenuChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const fieldName = id.replace('edit-', '');

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditMenu(prev => ({ ...prev, [fieldName]: checked }));
    } else {
      setEditMenu(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  // 提交编辑菜单表单
  const handleEditMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/menus/${editMenu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editMenu.name,
          description: editMenu.description,
          url: editMenu.url,
          isExternal: editMenu.isExternal ? 1 : 0,
          isActive: editMenu.isActive ? 1 : 0,
          parentId: editMenu.parentId ? Number(editMenu.parentId) : null,
          order: Number(editMenu.order)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`更新菜单失败: ${errorText}`);
      }

      await response.json();
      toast({
        title: '成功',
        description: '菜单更新成功',
      });
      setIsEditModalOpen(false);
      fetchMenus(); // 重新获取菜单列表
    } catch (error) {
      console.error('更新菜单出错:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开删除菜单确认框
  const handleOpenDeleteDialog = (id: number) => {
    setMenuToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除菜单
  const handleDeleteMenu = async () => {
    if (!menuToDelete) return;

    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/menus/${menuToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`删除菜单失败: ${errorText}`);
      }

      toast({
        title: '成功',
        description: '菜单删除成功',
      });
      setIsDeleteDialogOpen(false);
      fetchMenus(); // 重新获取菜单列表
    } catch (error) {
      console.error('删除菜单出错:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 可排序的菜单项组件
  const MenuItem = memo(({
    menu,
    onEdit,
    onDelete,
    dragHandleProps,
    isDragging
  }: {
    menu: MenuWithLevel;
    onEdit: (menu: Menu) => void;
    onDelete: (id: number) => void;
    dragHandleProps?: any;
    isDragging?: boolean;
  }) => {
    const { dropIndicator } = useContext(MenuContext);
    const isOver = dropIndicator?.id === menu.id;
    const isInside = isOver && dropIndicator?.type === 'inside';
    const isBefore = isOver && dropIndicator?.type === 'before';
    const isAfter = isOver && dropIndicator?.type === 'after';

    // 判断是否有子菜单
    const hasChildMenus = (id: number) => {
      return flattenedMenus.some(menu => menu.parentId === id);
    };

    return (
      <div
        className={`
          relative flex items-center justify-between p-3 mb-1 rounded-md border
          ${isDragging ? 'bg-gray-50' : 'bg-white'}
          ${isOver ? 'ring-2 ring-blue-400' : ''}
          ${hasChildMenus(menu.id) ? 'border-blue-100' : 'border-gray-200'}
        `}
        style={{
          marginLeft: `${menu.level * 20}px`,
          width: `calc(100% - ${menu.level * 20}px)`
        }}
      >
        {/* 拖拽指示器 */}
        {isBefore && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 -translate-y-1 z-20 flex items-center">
            <span className="absolute left-2 top-[-20px] bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-md">
              放置在此之前
            </span>
          </div>
        )}
        {isInside && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-md z-20 bg-blue-50 bg-opacity-50 flex items-center justify-center">
            <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded shadow-md">
              作为子菜单
            </span>
          </div>
        )}
        {isAfter && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 translate-y-1 z-20 flex items-center">
            <span className="absolute left-2 top-[4px] bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-md">
              放置在此之后
            </span>
          </div>
        )}

        <div className="flex items-center flex-1 min-w-0">
          <div {...dragHandleProps} className="cursor-grab mr-2 text-gray-400 hover:text-gray-600">
            <GripVertical size={16} />
          </div>

          <div className="truncate">
            <div className="font-medium text-gray-900 truncate flex items-center">
              {menu.isExternal ?
                <ExternalLink className="h-4 w-4 mr-1 text-gray-500" /> :
                <Link className="h-4 w-4 mr-1 text-gray-500" />
              }
              {menu.name}
              {hasChildMenus(menu.id) && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  有子菜单
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 truncate">{menu.url}</div>
          </div>
        </div>

        {/* 将操作按钮移到右边 */}
        <div className="flex items-center ml-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(menu)}
            className="h-8 w-8 p-0 mr-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(menu.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  });

  return (
    <MenuContext.Provider value={{ dropIndicator, setDropIndicator }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">菜单管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              管理网站的导航菜单，可以创建、编辑、删除和排序菜单项。拖拽菜单项可以调整顺序。
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              添加菜单
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={''}
              onChange={(e) => {}}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="搜索菜单..."
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-500">加载菜单中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                onClick={fetchMenus}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                重试
              </button>
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有菜单</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建您的第一个菜单吧</p>
              <div className="mt-6">
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  添加菜单
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white overflow-hidden">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                {/* 根区域 - 用于将子菜单变为顶级菜单 */}
                <RootDropArea />
                <SortableContext
                  items={flattenedMenus.map(menu => menu.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {flattenedMenus
                    .map((menu) => (
                      <SortableMenuItem
                        key={menu.id}
                        id={menu.id}
                        menu={menu}
                      >
                        <MenuItem
                          menu={menu}
                          onEdit={handleOpenEditModal}
                          onDelete={handleOpenDeleteDialog}
                        />
                      </SortableMenuItem>
                    ))}
                </SortableContext>

                <DragOverlay>
                  {activeId && isDragging ? (
                    <div className="bg-white p-4 rounded-md shadow-lg border-2 border-blue-500 w-64 relative">
                      <div className="flex items-center">
                        <GripVertical className="h-5 w-5 text-gray-500 mr-2" />
                        {/* 添加菜单图标，提升视觉识别度 */}
                        {flattenedMenus.find(m => m.id === Number(activeId))?.isExternal ? (
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                        ) : (
                          <Link className="h-4 w-4 mr-2 text-gray-500" />
                        )}
                        <span className="font-medium">
                          {flattenedMenus.find(m => m.id === Number(activeId))?.name}
                        </span>
                      </div>

                      {/* 水平偏移提示 - 更加醒目的设计 */}
                      {dragOffset && (
                        <div className="absolute -top-10 left-0 right-0 text-center">
                          <div className={`
                            inline-flex items-center px-3 py-1.5 rounded-md shadow-md
                            ${dragOffset.x > 20
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300"
                            }
                            font-medium text-sm
                          `}>
                            {dragOffset.x > 20 ? (
                              <>
                                <ChevronRight className="mr-1 h-4 w-4" />
                                子菜单模式 (上下移动选择目标父菜单)
                              </>
                            ) : (
                              <>
                                <ArrowUpDown className="mr-1 h-4 w-4" />
                                排序模式
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      {/* 创建菜单模态框 */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新菜单</DialogTitle>
            <DialogDescription>
              添加一个新的菜单项。请填写以下信息。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMenuSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  菜单名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={newMenu.name}
                  onChange={handleCreateMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={newMenu.description}
                  onChange={handleCreateMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL
                </Label>
                <Input
                  id="url"
                  type="text"
                  value={newMenu.url}
                  onChange={handleCreateMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center">
                  <Input
                    type="checkbox"
                    id="isExternal"
                    checked={newMenu.isExternal}
                    onChange={handleCreateMenuChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="isExternal" className="ml-2 block text-sm text-gray-700">
                    外部链接
                  </Label>
                </div>

                <div className="flex items-center">
                  <Input
                    type="checkbox"
                    id="isActive"
                    checked={newMenu.isActive}
                    onChange={handleCreateMenuChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    启用
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                    父菜单
                  </Label>
                  <select
                    id="parentId"
                    value={newMenu.parentId}
                    onChange={handleCreateMenuChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">无 (顶级菜单)</option>
                    {menus
                      .filter(menu => {
                        // 不能选择自己作为父菜单
                        // 不能选择已经有子菜单的菜单作为父菜单（避免多层嵌套）
                        return !hasChildMenus(menu.id);
                      })
                      .map(menu => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <Label htmlFor="order" className="block text-sm font-medium text-gray-700">
                    排序
                  </Label>
                  <Input
                    type="number"
                    id="order"
                    value={newMenu.order}
                    onChange={handleCreateMenuChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit">
                  创建菜单
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑菜单模态框 */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑菜单</DialogTitle>
            <DialogDescription>
              修改菜单项信息。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMenuSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  菜单名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="edit-name"
                  value={editMenu.name}
                  onChange={handleEditMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                  描述
                </Label>
                <Textarea
                  id="edit-description"
                  value={editMenu.description}
                  onChange={handleEditMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-url" className="block text-sm font-medium text-gray-700">
                  URL
                </Label>
                <Input
                  id="edit-url"
                  type="text"
                  value={editMenu.url}
                  onChange={handleEditMenuChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center">
                  <Input
                    type="checkbox"
                    id="edit-isExternal"
                    checked={editMenu.isExternal}
                    onChange={handleEditMenuChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="edit-isExternal" className="ml-2 block text-sm text-gray-700">
                    外部链接
                  </Label>
                </div>

                <div className="flex items-center">
                  <Input
                    type="checkbox"
                    id="edit-isActive"
                    checked={editMenu.isActive}
                    onChange={handleEditMenuChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-700">
                    启用
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-parentId" className="block text-sm font-medium text-gray-700">
                    父菜单
                  </Label>
                  <select
                    id="edit-parentId"
                    value={editMenu.parentId}
                    onChange={handleEditMenuChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">无 (顶级菜单)</option>
                    {menus
                      .filter(menu => {
                        // 不能选择自己作为父菜单
                        if (menu.id === editMenu.id) return false;

                        // 不能选择自己的子菜单作为父菜单
                        if (menu.parentId === editMenu.id) return false;

                        // 不能选择已经有子菜单的菜单作为父菜单（避免多层嵌套）
                        if (hasChildMenus(menu.id)) return false;

                        // 不能选择自己的子孙菜单作为父菜单（递归检查）
                        const isDescendant = (parentId: number | null, targetId: number): boolean => {
                          if (!parentId) return false;
                          if (parentId === targetId) return true;

                          const children = menus.filter(m => m.parentId === parentId);
                          return children.some(child => isDescendant(child.id, targetId));
                        };

                        return !isDescendant(menu.id, editMenu.id);
                      })
                      .map(menu => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-order" className="block text-sm font-medium text-gray-700">
                    排序
                  </Label>
                  <Input
                    type="number"
                    id="edit-order"
                    value={editMenu.order}
                    onChange={handleEditMenuChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit">
                  保存修改
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除菜单确认框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个菜单吗？此操作不可撤销，如果该菜单有子菜单，所有子菜单也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMenu} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MenuContext.Provider>
  );
}
