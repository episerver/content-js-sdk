'use client';

import Link from 'next/link';

interface NavItem {
  _metadata: {
    key: string;
    displayName: string;
    url: {
      hierarchical: string;
    };
  };
  children?: NavItem[];
}

interface SidebarNavProps {
  navigationTree: NavItem[];
  currentPath: string;
}

export function SidebarNav({ navigationTree, currentPath }: SidebarNavProps) {
  return (
    <nav className="space-y-0">
      {navigationTree.map((item, index) => {
        const parentPath = item._metadata?.url?.hierarchical;
        const hasChildren = item.children && item.children.length > 0;

        // Check if current path is this item or a descendant (starts with the item's path)
        const isActive = parentPath === currentPath;
        const isDescendant = currentPath.startsWith(parentPath);

        // Auto-expand if current path is under this parent or any of its children
        const isParentActive = isDescendant;
        const hasActiveChild = hasChildren && item.children!.some(
          (child) => {
            const childPath = child._metadata?.url?.hierarchical;
            return currentPath === childPath || currentPath.startsWith(childPath);
          }
        );
        const isExpanded = isParentActive || hasActiveChild;

        const showBorder = index < navigationTree.length - 1;

        return (
          <div key={item._metadata.key} className={showBorder ? 'border-b border-gray-200' : ''}>
            <Link
              href={item._metadata?.url?.hierarchical || '#'}
              className={`block px-4 py-3 text-base font-medium transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-700 hover:text-teal-600'
              }`}
            >
              {item._metadata?.displayName}
            </Link>

            {/* Nested children - only show when expanded */}
            {hasChildren && isExpanded && (
              <div className="border-t border-gray-100">
                {item.children!.map((child, childIndex) => {
                  const childPath = child._metadata?.url?.hierarchical;
                  // Highlight if current path is this child or a descendant
                  const isChildActive = currentPath === childPath || currentPath.startsWith(childPath);
                  const showChildBorder = childIndex < item.children!.length - 1;

                  return (
                    <div
                      key={child._metadata.key}
                      className={showChildBorder ? 'border-b border-gray-100' : ''}
                    >
                      <Link
                        href={child._metadata?.url?.hierarchical || '#'}
                        className={`block pl-8 pr-4 py-3 text-sm transition-colors ${
                          isChildActive
                            ? 'text-teal-600'
                            : 'text-gray-700 hover:text-teal-600'
                        }`}
                      >
                        {child._metadata?.displayName}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
