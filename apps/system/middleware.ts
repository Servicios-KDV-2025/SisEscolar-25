// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// import { rootDomain } from './lib/utils';
// import { NextRequest, NextResponse } from 'next/server';

// const isProtectedRoute = createRouteMatcher(['/inicio'])

// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoute(req)) await auth.protect()

//   console.log(extractSubdomain(req));
// })

// function extractSubdomain(req: NextRequest) {
//   const host = req.headers.get('host') || '';
//   const subdomain = host.split('.')[0];
  

//   if (subdomain?.includes('localhost') || subdomain?.includes('127.0.0.1'))  {
//     console.log('localhost');

//   }
//   return subdomain;
// }




// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';
import { rootDomain } from './lib/utils';

const isPublicRoute = createRouteMatcher([
  '/api/(.*)',
  '/registro'
])



function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname?.includes('.localhost')) {
      return hostname?.split('.')[0] || null;
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname?.includes('---') && hostname?.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] || null : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname?.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname?.replace(`.${rootDomainFormatted}`, '') || null : null;
}

export default clerkMiddleware(async (auth, req) => {
  const request = req as NextRequest;
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  const isSubdomainRoot = subdomain && pathname === '/';
  const isRootDomain = pathname === '/';

  // Primero manejar la autenticación de Clerk
  if (!isPublicRoute(req) && !isSubdomainRoot && !isRootDomain) {
    await auth.protect();
  }

  // Luego manejar la lógica de subdominios
  if (subdomain) {
    // Excluir rutas que no deben ser reescritas
    const excludedPaths = [
      '/api',
      '/_next',
      '/favicon.ico',
      '/error',
      '/_vercel',
      '/static'
    ];

    const shouldExclude = excludedPaths.some(path => pathname.startsWith(path));
    
    if (!shouldExclude) {
      // Manejar todas las rutas con wildcard
      if (pathname === '/') {
        // Para la ruta raíz, redirigir a la página del subdominio
        return NextResponse.rewrite(new URL(`/${subdomain}/`, request.url));
      } else {
        // Para cualquier otra ruta, agregar el subdominio al inicio
        const targetUrl = new URL(`/${subdomain}${pathname}`, request.url);
        return NextResponse.rewrite(targetUrl);
      }
    }
  }

  // On the root domain, allow normal access
  return NextResponse.next();
},
{
  // debug: process.env.NODE_ENV === 'development',
  // authorizedParties: ['http://localhost:3000', 'http://mbvsr2.localhost:3000'],
}
)


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}