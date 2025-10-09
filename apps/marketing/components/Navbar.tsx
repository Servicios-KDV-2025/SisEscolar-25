import {OptimisticSortOrder} from '@/components/OptimisticSortOrder'
import type {SettingsQueryResult} from '@/sanity.types'
import {studioUrl} from '@/sanity/lib/api'
import {resolveHref} from '@/sanity/lib/utils'
import {createDataAttribute, stegaClean} from 'next-sanity'
import Link from 'next/link'
import SimpleMenu from './Nav/SimpleMenu'
import SubMenu from './Nav/SubMenu'
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
      <div className="flex-1 flex justify-center">
        <OptimisticSortOrder id={data?._id} path="nav">
          <NavigationMenu className='my-2'>
            <NavigationMenuList>
        {
          data?.nav?.menus?.map((menu, index) => {
            if (menu._type === 'simpleMenu') {
              return <SimpleMenu key={menu._key} slug={menu.slug} type_reference={menu.type_reference} link={menu.link!} />;
            }
            if (menu._type === 'menuWithSubmenu') {
              return (
                <SubMenu key={menu._key} title={menu.title} submenus={menu.submenus ?? []} />
              )
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
                'menuItems',
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
    </header>
  )
}
