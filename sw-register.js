// Registro simple con control de actualización
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('Service Worker registrado:', reg);

      // Detecta nueva versión de SW
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('Nueva versión disponible - recarga recomendada');
              // Puedes notificar al usuario aquí para recargar
              // e.g., mostrar un toast con botón 'Recargar'
            } else {
              console.log('Contenido cacheado para uso offline.');
            }
          }
        });
      });

    }).catch((err) => {
      console.warn('Registro de SW falló:', err);
    });
  });
}
