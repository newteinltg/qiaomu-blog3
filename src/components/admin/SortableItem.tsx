'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Edit, Trash, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Category } from '@/contexts/CategoriesContext';

// 使用 Category 类型作为 Item 类型
type Item = Category;

interface SortableItemProps {
  item: Item;
  isActive: boolean;
  isOver: boolean;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  type: 'category' | 'menu';
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (id: number) => void;
}

export function SortableItem({
  item,
  isActive,
  isOver,
  onEdit,
  onDelete,
  type,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse = () => {},
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActive ? 0.5 : 1,
    backgroundColor: isOver ? 'rgba(236, 253, 245, 0.5)' : undefined,
  };

  // 确保 level 属性存在，默认为 0
  const level = item.level || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 px-6 py-4 text-sm ${isActive ? 'bg-gray-50' : ''} ${isOver ? 'bg-green-50' : ''}`}
    >
      <div className="col-span-4">
        <div className="flex items-center">
          <div 
            className="cursor-move mr-2 flex-shrink-0 text-gray-400" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          {level > 0 && (
            <div 
              className="flex-shrink-0" 
              style={{ 
                width: `${(level - 1) * 24}px`,
                borderLeft: level > 1 ? '1px dashed #e5e7eb' : 'none',
                height: '24px',
                position: 'relative',
                marginRight: '8px'
              }}
            >
              {level > 1 && (
                <div 
                  style={{ 
                    position: 'absolute',
                    bottom: '12px',
                    width: '24px',
                    height: '1px',
                    borderBottom: '1px dashed #e5e7eb'
                  }}
                />
              )}
            </div>
          )}
          
          {hasChildren && (
            <button
              onClick={() => onToggleCollapse(item.id)}
              className="mr-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
          
          <span style={{ marginLeft: hasChildren ? '0' : `${level > 0 ? 4 : 0}px` }}>
            {item.name}
          </span>
        </div>
      </div>
      <div className="col-span-2 truncate text-gray-500">
        {item.slug}
      </div>
      <div className="col-span-4 truncate text-gray-500">
        {item.description || '-'}
      </div>
      <div className="col-span-1 text-gray-500">
        {item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : '-'}
      </div>
      <div className="col-span-1 text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="text-blue-600 hover:text-blue-900 px-2 h-8"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">编辑</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item)}
            className="text-red-600 hover:text-red-900 px-2 h-8"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">删除</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
