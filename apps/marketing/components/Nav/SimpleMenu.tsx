

import { LinkInternal } from '@/sanity.types'
import React from 'react'
import { NavigationMenuItem, NavigationMenuLink , navigationMenuTriggerStyle} from '../ui/navigation-menu';
import { resolveHref } from '@/sanity/lib/utils';

interface SimpleMenuProps {
    link?: LinkInternal;
    slug: string | null;
    type_reference: "home" | "page" | null;
}



const SimpleMenu = ({link, slug, type_reference}:SimpleMenuProps) => {
    return (
        <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()} href={(resolveHref(type_reference!, slug)) || '#'}>
                {link?.label}
            </NavigationMenuLink>
        </NavigationMenuItem>
  )
}

export default SimpleMenu
