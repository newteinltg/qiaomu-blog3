'use client';

import {
  HomeIcon as HeroHomeIcon,
  DocumentTextIcon as HeroDocumentTextIcon,
  TagIcon as HeroTagIcon,
  Bars3Icon as HeroBars3Icon,
  Cog6ToothIcon as HeroCog6ToothIcon,
  ArrowTopRightOnSquareIcon as HeroArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon as HeroArrowRightOnRectangleIcon,
  FolderIcon as HeroFolderIcon,
  UserIcon as HeroUserIcon,
  LinkIcon as HeroLinkIcon
} from '@heroicons/react/24/outline';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function HomeIcon(props: IconProps) {
  return <HeroHomeIcon {...props} />;
}

export function DocumentTextIcon(props: IconProps) {
  return <HeroDocumentTextIcon {...props} />;
}

export function TagIcon(props: IconProps) {
  return <HeroTagIcon {...props} />;
}

export function Bars3Icon(props: IconProps) {
  return <HeroBars3Icon {...props} />;
}

export function Cog6ToothIcon(props: IconProps) {
  return <HeroCog6ToothIcon {...props} />;
}

export function ArrowTopRightOnSquareIcon(props: IconProps) {
  return <HeroArrowTopRightOnSquareIcon {...props} />;
}

export function ArrowRightOnRectangleIcon(props: IconProps) {
  return <HeroArrowRightOnRectangleIcon {...props} />;
}

export function FolderIcon(props: IconProps) {
  return <HeroFolderIcon {...props} />;
}

export function UserIcon(props: IconProps) {
  return <HeroUserIcon {...props} />;
}

export function LinkIcon(props: IconProps) {
  return <HeroLinkIcon {...props} />;
}
