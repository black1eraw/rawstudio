/* ============================================================
   MODO CLARO / OSCURO — JavaScript nativo
   Manipulación del DOM mediante classList
  

   ¿QUÉ SE HIZO PARA QUE FUNCIONE EN FIREFOX?
   ---------------------------------------------------------
   Al abrir el sitio con doble clic (protocolo file://), Firefox
   trata cada archivo .html como un ORIGEN AISLADO Y DISTINTO
   (política privacy.file_unique_origin). Como localStorage está
   atado al origen, Firefox no comparte lo guardado en index.html
   con lo que lee quienes-somos.html, aunque sean archivos de la
   misma carpeta. Además, si localStorage llega a tirar una
   excepción (SecurityError) y nadie la atrapa, el script se corta
   y ni siquiera queda enganchado el click del botón.

   Por eso la persistencia se resuelve de DOS formas combinadas:

   1) localStorage envuelto en try/catch (funciones safeGetItem /
      safeSetItem): si el navegador lo permite (Chrome, Brave, o
      cualquiera sirviendo el sitio por http), se guarda ahí.
      Si falla, el error se atrapa y el script sigue funcionando
      igual, solo que sin recordar el tema la próxima vez.

   2) Parámetro en la URL (?tema=oscuro): es el respaldo que SÍ
      viaja de una página a otra sin depender de ningún storage.
      Cada vez que se aplica un tema, se reescriben los href de
      los links del menú para que ya incluyan ese parámetro. Así,
      al hacer click en "Quiénes somos" estando en modo oscuro, el
      link ya apunta a "quienes-somos.html?tema=oscuro", y esa
      página lee el parámetro apenas carga y aplica el tema antes
      de que el usuario note nada. Esto funciona igual en Firefox,
      Chrome o Brave, con o sin servidor.
   ============================================================ */

(function () { /* IIFE (función que se ejecuta sola): evita que estas variables y funciones ensucien el scope global */
  'use strict'; /* activa el modo estricto de JS: errores más claros, evita variables globales accidentales */

  const toggleBtn = document.getElementById('theme-toggle'); /* referencia al botón de modo claro/oscuro */
  const body = document.body; /* referencia al <body>, donde se agrega/saca la clase dark-mode */
  const STORAGE_KEY = 'rawstudio-theme'; /* nombre de la clave bajo la que se guarda el tema en localStorage */
  const URL_PARAM = 'tema'; // valores: "oscuro" | "claro" /* nombre del parámetro que se agrega a la URL */

  /* ---------- localStorage seguro (puede fallar en Firefox + file://) ---------- */
  function safeGetItem(key) {
    try {
      return localStorage.getItem(key); /* intenta leer el valor guardado */
    } catch (err) {
      return null; /* si Firefox bloquea el acceso (file://), no rompe el script: devuelve "no hay nada guardado" */
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value); /* intenta guardar el valor */
    } catch (err) {
      // No se pudo persistir en este navegador/origen (típico de Firefox + file://).
      // No pasa nada: el parámetro en la URL sigue garantizando la continuidad entre páginas.
    }
  }

  /* ---------- Lectura del tema desde la URL actual ---------- */
  function getThemeFromURL() {
    const params = new URLSearchParams(window.location.search); /* parsea la query string de la URL actual (todo lo que va después del "?") */
    const value = params.get(URL_PARAM); /* busca el valor del parámetro "tema" */
    if (value === 'oscuro') return true; /* la URL pide modo oscuro */
    if (value === 'claro') return false; /* la URL pide modo claro */
    return null; // no había parámetro en la URL /* no vino de un link interno con tema, hay que decidir por otra vía */
  }

  /**
   * Reescribe los href de los links internos (los que apuntan a otro
   * .html del sitio) para que lleven el tema actual como parámetro.
   * Así, al hacer click y cambiar de página, el tema no se pierde
   * ni siquiera en Firefox abierto con file://.
   */
  function propagateThemeToLinks(isDark) {
    const theme = isDark ? 'oscuro' : 'claro'; /* traduce el booleano a la palabra que va en la URL */
    document.querySelectorAll('a[href]').forEach(function (link) { /* recorre todos los links de la página */
      const href = link.getAttribute('href'); /* lee el href tal cual está escrito en el HTML */
      if (!href) return; /* si por algún motivo no tiene href, lo salta */
      // Ignorar links externos, anclas internas (#...) y mailto/tel
      if (/^(https?:|mailto:|tel:|#)/i.test(href)) return; /* no toca links a otros sitios, anclas ni contactos */
      // Solo tocar links que apunten a páginas .html del propio sitio
      if (!/\.html(\?|$)/i.test(href)) return; /* si no termina en .html (con o sin query), tampoco lo toca */

      const basePath = href.split('?')[0]; /* se queda solo con la parte antes de un "?", por si ya tenía uno */
      link.setAttribute('href', basePath + '?' + URL_PARAM + '=' + theme); /* reescribe el href con el tema actual */
    });
  }

  /**
   * Aplica el tema al DOM y actualiza el label del botón.
   */
  function applyTheme(isDark) {
    if (isDark) {
      body.classList.add('dark-mode'); /* activa el modo oscuro: dispara todas las variables de body.dark-mode en el CSS */
      toggleBtn.textContent = '☀ Modo claro'; /* el botón ahora ofrece volver a modo claro */
      toggleBtn.setAttribute('aria-pressed', 'true'); /* le informa a tecnologías de asistencia que el botón está "activado" */
      toggleBtn.setAttribute('aria-label', 'Cambiar a modo claro'); /* describe la acción que hace el botón en este estado */
    } else {
      body.classList.remove('dark-mode'); /* vuelve a modo claro: se usan las variables por defecto de :root */
      toggleBtn.textContent = '☾ Modo oscuro'; /* el botón ahora ofrece pasar a modo oscuro */
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
    }
    // Cada vez que se aplica un tema, los links de navegación se actualizan
    // para que la próxima página que se abra ya arranque con el mismo tema.
    propagateThemeToLinks(isDark); /* clave para que el tema sobreviva a un cambio de página en Firefox */
  }

  /**
   * Decide qué tema usar al cargar la página, en este orden de prioridad:
   * 1. Parámetro ?tema= en la URL (viene de haber navegado desde otra página)
   * 2. Valor guardado en localStorage (si el navegador lo permite)
   * 3. Preferencia de tema del sistema operativo
   */
  function initTheme() {
    const fromURL = getThemeFromURL(); /* prioridad 1: ¿la URL ya trae el tema? (esto es lo que salva a Firefox) */

    if (fromURL !== null) {
      applyTheme(fromURL); /* aplica el tema que vino en la URL */
      safeSetItem(STORAGE_KEY, fromURL ? 'dark' : 'light'); /* de paso, intenta guardarlo por si este navegador sí soporta localStorage */
      return; /* corta acá, ya se resolvió */
    }

    const saved = safeGetItem(STORAGE_KEY); /* prioridad 2: ¿hay algo guardado de una visita anterior? */
    if (saved !== null) {
      applyTheme(saved === 'dark'); /* aplica el tema guardado */
      return; /* corta acá */
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; /* prioridad 3: pregunta al sistema operativo */
    applyTheme(prefersDark); /* aplica el tema según la preferencia del sistema */
  }

  /**
   * Maneja el click en el botón: alterna el tema y lo guarda.
   */
  function handleToggle() {
    const isCurrentlyDark = body.classList.contains('dark-mode'); /* revisa el estado actual mirando la clase del body */
    const newIsDark = !isCurrentlyDark; /* invierte ese estado */

    applyTheme(newIsDark); /* aplica el nuevo tema y reescribe los links */
    safeSetItem(STORAGE_KEY, newIsDark ? 'dark' : 'light'); /* intenta persistirlo para la próxima vez que se abra el sitio */
  }

  if (document.readyState === 'loading') { /* si el HTML todavía se está parseando cuando corre este script */
    document.addEventListener('DOMContentLoaded', function () { /* espera a que el DOM esté completamente armado */
      initTheme(); /* recién ahí decide y aplica el tema inicial */
      toggleBtn.addEventListener('click', handleToggle); /* y engancha el click del botón */
    });
  } else {
    // DOM ya disponible (por ejemplo, si el script se carga al final del body, como en este proyecto)
    initTheme();
    toggleBtn.addEventListener('click', handleToggle);
  }

})();