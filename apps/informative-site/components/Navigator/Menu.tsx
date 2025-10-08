import { SingleMenuItem } from "@/types";
import { NavigationMenuItem, NavigationMenuLink } from "@radix-ui/react-navigation-menu";
import React from "react";
import { navigationMenuTriggerStyle } from "../ui/navigation-menu";
import Link from "next/link";
import {stegaClean} from 'next-sanity'
import { resolveHref } from "@/sanity/lib/utils";

export const Menu = ({ link, slug, type_reference}:SingleMenuItem) => {
    return <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link
                href={resolveHref(type_reference!, slug) || '#'}
                className="bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground transition-colors data-[active]:bg-accent data-[active]:text-accent-foreground !rounded-xl px-4 py-2"
            >
            {
             stegaClean(link?.label)       
            }
            </Link>
      </NavigationMenuLink>
  </NavigationMenuItem>;
};
