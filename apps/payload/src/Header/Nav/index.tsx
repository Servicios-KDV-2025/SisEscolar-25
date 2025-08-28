'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-3 items-center">
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map((navItem, i) => {
            const { link, submenu, isButton, buttonStyle } = navItem

            // Si tiene submenú, renderizar con dropdown
            if (submenu && submenu.length > 0) {
              return (
                <NavigationMenuItem key={i}>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground transition-colors text-foreground !rounded-xl px-4 py-2">
                    {link?.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!rounded-xl overflow-hidden">
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-popover border border-border shadow-md">
                      {submenu.map(({ link: subLink }, j) => (
                        <li key={j}>
                          <NavigationMenuLink asChild>
                            <CMSLink
                              {...subLink}
                              className="block select-none !rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-foreground"
                            />
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            }

            // Si no tiene submenú, renderizar link normal o botón
            return (
              <NavigationMenuItem key={i}>
                {isButton ? (
                  <Button
                    variant={buttonStyle || 'default'}
                    size="sm"
                    className="h-9 px-4 text-sm font-medium !rounded-xl"
                    asChild
                  >
                    <CMSLink {...link} />
                  </Button>
                ) : (
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <CMSLink
                      {...link}
                      className="bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground transition-colors data-[active]:bg-accent data-[active]:text-accent-foreground !rounded-xl px-4 py-2"
                    />
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
      <Link
        href="/search"
        className="ml-2 p-2 !rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-foreground" />
      </Link>
    </nav>
  )
}
