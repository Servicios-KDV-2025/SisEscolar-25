import { MultiMenuItem } from "@/types";
import React from "react";
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "../ui/navigation-menu";
import Link from "next/link";
import { resolveHref } from "@/sanity/lib/utils";
import {stegaClean} from 'next-sanity'

export const Submenus = ({ submenu, title}:MultiMenuItem) => {
    return <NavigationMenuItem>
        <NavigationMenuTrigger>
        {title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
            <ul className="w-[400px] p-4 bg-popover flex flex-col gap-2 text-center">
                {
                submenu?.map((submenu, index) => {
                    return (
                            <li key={submenu._key || index}>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href={
                                        resolveHref(submenu.type_reference!, submenu.slug) || '#'
                                        }>
                                        {stegaClean(submenu.link?.label)}
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        );
                    })
                }
            </ul>
        </NavigationMenuContent>
    </NavigationMenuItem>
};
