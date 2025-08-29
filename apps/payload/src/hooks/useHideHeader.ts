import { useEffect } from 'react';

// Hook para ocultar el header en páginas específicas
export const useHideHeader = (shouldHide: boolean = false) => {
  useEffect(() => {
    if (shouldHide) {
      // Ocultar el header
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }
    } else {
      // Mostrar el header
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    }

    // Cleanup: restaurar el header cuando el componente se desmonte
    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    };
  }, [shouldHide]);
};

// Hook para ocultar el header basado en la ruta actual
export const useHideHeaderByRoute = (routesToHide: string[] = []) => {
  useEffect(() => {
    const currentPath = window.location.pathname;
    const shouldHide = routesToHide.some(route => 
      currentPath.startsWith(route) || currentPath === route
    );

    const header = document.querySelector('header');
    if (header) {
      header.style.display = shouldHide ? 'none' : 'block';
    }

    // Cleanup
    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    };
  }, [routesToHide]);
};
