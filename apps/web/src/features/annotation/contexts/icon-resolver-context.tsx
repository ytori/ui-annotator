import { Box, type LucideIcon } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

/**
 * Icon resolver function type
 * Takes a component name and returns a Lucide icon component
 */
export type IconResolver = (componentName?: string) => LucideIcon;

/**
 * Default icon resolver - returns Box icon for everything
 */
const defaultIconResolver: IconResolver = () => Box;

/**
 * Context for resolving component icons
 * This allows annotation feature to display icons without depending on component-catalog
 */
const IconResolverContext = createContext<IconResolver>(defaultIconResolver);

/**
 * Provider for icon resolver
 */
export function IconResolverProvider({
  resolver,
  children,
}: {
  resolver: IconResolver;
  children: ReactNode;
}) {
  return (
    <IconResolverContext.Provider value={resolver}>
      {children}
    </IconResolverContext.Provider>
  );
}

/**
 * Hook to get the icon resolver
 * @returns Function that takes a component name and returns an icon
 */
export function useIconResolver(): IconResolver {
  return useContext(IconResolverContext);
}

/**
 * Hook to get an icon for a specific component
 * @param componentName - The name of the component
 * @returns The Lucide icon component
 */
function _useComponentIcon(componentName?: string): LucideIcon {
  const resolver = useIconResolver();
  return resolver(componentName);
}
