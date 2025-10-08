import {OptimisticSortOrder} from '@/components/OptimisticSortOrder'
import type {SettingsQueryResult} from '@/sanity.types'
import {studioUrl} from '@/sanity/lib/api'
import {resolveHref} from '@/sanity/lib/utils'
import {createDataAttribute, stegaClean} from 'next-sanity'
import Link from 'next/link'
import { Menu } from './Navigator/Menu'
import { Submenus } from './Navigator/Sumenus'
import { NavigationMenu, NavigationMenuList } from './ui/navigation-menu'

interface NavbarProps {
  data: SettingsQueryResult
}
export function Navbar(props: NavbarProps) {
  const {data} = props
  const dataAttribute =
    data?._id && data?._type
      ? createDataAttribute({
          baseUrl: studioUrl,
          id: data._id,
          type: data._type,
        })
      : null
  return (
    <header
      className=" sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-sanity={dataAttribute?.('nav')}
    >
      <div className='flex h-16  items-center justify-between px-4'>
      <div  className="flex-1 flex justify-center">
        <OptimisticSortOrder id={data?._id} path="menuItems">
          <NavigationMenu>
            <NavigationMenuList>
            {
              data?.nav?.menus?.map((menuItem, index) => {
                if (menuItem._type === 'simpleMenu') {
                  const { _key, link, type_reference, slug } = menuItem
                  return <Menu link={link} slug={slug!} type_reference={type_reference!} key={_key || index}
                    data-sanity={dataAttribute?.([
                    'nav_item',
                    {_key: menuItem._key as unknown as string},
                  ])}
                  />
                }

                if (menuItem._type === 'menuWithSubmenu') {
                  const { _key, title, submenus } = menuItem
                  return <Submenus submenu={submenus} title={title} key={_key || index}
                    data-sanity={dataAttribute?.([
                    'nav_item',
                    {_key: menuItem._key as unknown as string},
                  ])}
                  />
                }
                return null;
              })
            }

            {/* {data?.menuItems?.map((menuItem) => {
              const href = resolveHref(menuItem?._type, menuItem?.slug)
              if (!href) {
                return null
              }
              return (
                <Link
                  key={menuItem._key}
                  className={`text-lg hover:text-black md:text-xl ${
                    menuItem?._type === 'home' ? 'font-extrabold text-black' : 'text-gray-600'
                  }`}
                  data-sanity={dataAttribute?.([
                    'nav',
                    {_key: menuItem._key as unknown as string},
                  ])}
                  href={href}
                >
                  {stegaClean(menuItem.title)}
                </Link>
              )
            })} */}
              </NavigationMenuList>
          </NavigationMenu>
        </OptimisticSortOrder>
        </div>
      </div>
    </header>
  )
}
