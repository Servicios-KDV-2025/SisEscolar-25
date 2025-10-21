import React from 'react'
import { PriceBlockComponent } from './PriceBlock';
import { ImageItem, PriceItem, TextItem } from '@/types';
import Image from 'next/image';
import { urlForImage } from '@/sanity/lib/utils';

type GridItem = ImageItem | PriceItem | TextItem;

interface GridBlockProps {
  items: GridItem[];
}
export const GridBlock = ({ items }: GridBlockProps) => {


    const columnCount = items!.length > 3 ? 3 : items!.length;

    return <div className={columnCount === 1 ? 'grid grid-cols-1 gap-4' : columnCount === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4'}>
        {
            items!.map((item) => {
                if (item._type === 'priceItem') {
                    return <PriceBlockComponent key={item._key} price={item.price!} />;
                }
                if (item._type === 'imageItem') { 
                    const urlImage = urlForImage(item.image!)?.url()
                    return <Image key={item._key} src={urlImage!} alt={''}  width={300} height={500}/>
                }

                return null;
            })
        }
  </div>;
};
