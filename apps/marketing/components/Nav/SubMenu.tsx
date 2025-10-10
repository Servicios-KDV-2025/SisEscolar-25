import { SubMenuItem } from '@/types';
import React from 'react'
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from '../ui/navigation-menu';
import { resolveHref } from '@/sanity/lib/utils';
import { stegaClean } from 'next-sanity'

interface SubMenuProps{
    title?: string;
    submenus : SubMenuItem[];
}

const SubMenu = ({title, submenus }: SubMenuProps) => {
    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger>
            {stegaClean(title) || ''}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="w-[400px] p-4 bg-popover flex flex-col gap-2 text-center List two">
                    {
                        submenus.map((submenu) => {
                            return <li key={submenu._key}>
                                <NavigationMenuLink  href={resolveHref(submenu.type_reference!, submenu.slug) || '#'} >
                                    {
                                        submenu.link?.label
                                    }
                                </NavigationMenuLink>
                            </li>;
                        })    
                    }        
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    )
}




export default SubMenu
