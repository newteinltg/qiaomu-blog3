'use client';

import NextLink from 'next/link';
import { forwardRef } from 'react';

export interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  className?: string;
  children: React.ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NextLink className={className} ref={ref} {...props}>
        {children}
      </NextLink>
    );
  }
);

Link.displayName = 'Link';
