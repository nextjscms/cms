'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SidebarLink({ 
  href, 
  children, 
  exact = false, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  exact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Construct the full current path including search params
  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
  
  // We need to parse href to separate its path and query
  let hrefPath = href;
  let hrefQuery = '';
  if (href.includes('?')) {
    const parts = href.split('?');
    hrefPath = parts[0];
    hrefQuery = parts[1];
  }

  // Active check logic:
  let isActive = false;
  
  if (exact) {
    isActive = currentUrl === href;
  } else {
    // Determine the effective path and searchParams we want to test against.
    // If the user is on the editor page, we want the sidebar to act as if they are on the posts list.
    const isEditor = pathname.startsWith('/admin/editor');
    const effectivePathname = isEditor ? '/admin/posts' : pathname;
    
    // The editor uses 'type=post' or 'type=page' by default, or the custom post type slug.
    // If we're on the editor and it's missing 'type', assume it's 'post' or matching the list.
    let effectiveSearchParams = new URLSearchParams(searchParams.toString());
    if (isEditor && !effectiveSearchParams.has('type')) {
      effectiveSearchParams.set('type', 'post');
    }

    // Check if the effective pathname starts with the href path
    if (effectivePathname.startsWith(hrefPath)) {
      if (hrefQuery) {
        // If href has a query (like ?type=product), the current url must have that exact query param
        const hrefParams = new URLSearchParams(hrefQuery);
        let matchesAll = true;
        hrefParams.forEach((value, key) => {
          if (effectiveSearchParams.get(key) !== value) {
            matchesAll = false;
          }
        });
        isActive = matchesAll;
      } else {
        // If href has NO query (like /admin/posts), it should only be active if current url has NO 'type' query, OR if type is 'post'
        // This prevents the generic "/admin/posts" from being active when visiting "/admin/posts?type=product"
        if (hrefPath === '/admin/posts') {
          const type = effectiveSearchParams.get('type');
          isActive = !type || type === 'post';
        } else if (hrefPath === '/admin/pages') {
          // If we are editing a page (/admin/editor?type=page)
          const type = effectiveSearchParams.get('type');
          if (isEditor) {
             isActive = type === 'page';
          } else {
             isActive = pathname.startsWith('/admin/pages');
          }
        } else {
          // Standard startsWith check for nested routes
          isActive = effectivePathname.length === hrefPath.length || effectivePathname[hrefPath.length] === '/' || effectivePathname[hrefPath.length] === '?';
        }
      }
    }
  }

  return (
    <Link 
      href={href} 
      className={cn(
        className, 
        isActive ? 'bg-neutral-800 text-white' : ''
      )}
    >
      {children}
    </Link>
  );
}
