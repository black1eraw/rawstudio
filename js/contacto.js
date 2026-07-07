/* ============================================================
   RAW STUDIO — CONTACTO.JS
   Controles de accesibilidad exclusivos del formulario de contacto:
   1) Mensaje de error puntual por campo cuando la validación nativa
      de HTML5 lo rechaza, para que una persona ciega sepa en qué
      campo está y por qué no puede avanzar (no solo el borde rojo).
   2) Confirmación de envío anunciada por una región viva, ya que
      esta página no tiene backend real y el envío no recarga nada.
   ============================================================ */

(function () { /* IIFE: evita ensuciar el scope global */
  'use strict';

  const form = document.querySelector('.contact-form');
  if (!form) return; /* por si este script se cargara en otra página sin este formulario */

  const status = document.getElementById('form-status');

  /* Un mensaje por campo, más concreto que el globo genérico del navegador */
  const ERROR_MESSAGES = {
    nombre: 'Ingresá tu nombre completo: al menos 2 caracteres.',
    email: 'Ingresá un correo electrónico válido, con el formato nombre@dominio.com.',
    telefono: 'Revisá el teléfono: solo números, espacios y el signo +, entre 6 y 20 caracteres.',
    tipo: 'Elegí una opción de la lista.',
    mensaje: 'Escribí un mensaje de al menos 20 caracteres.'
  };

  function fieldErrorEl(field) {
    return document.getElementById(field.id + '-error'); /* cada campo tiene su span "<id>-error" en el HTML */
  }

  function showError(field) {
    const errorEl = fieldErrorEl(field);
    if (!errorEl) return;
    errorEl.textContent = ERROR_MESSAGES[field.id] || 'Revisá este campo antes de continuar.';
    field.setAttribute('aria-invalid', 'true'); /* refuerza para lectores de pantalla que el valor actual no es válido */
  }

  function clearError(field) {
    const errorEl = fieldErrorEl(field);
    if (errorEl) errorEl.textContent = '';
    field.removeAttribute('aria-invalid');
  }

  /* El evento "invalid" no burbujea: se escucha en captura sobre el <form> para
     enterarse de cualquier campo inválido al intentar enviar. */
  form.addEventListener('invalid', function (e) {
    e.preventDefault(); /* reemplaza el globo nativo del navegador por nuestro propio mensaje, ya conectado por aria-describedby */
    showError(e.target);
  }, true);

  /* Apenas el campo vuelve a cumplir sus reglas, se borra el error, sin esperar a un nuevo envío */
  function clearIfValidNow(e) {
    const field = e.target;
    if (field.willValidate && field.checkValidity()) {
      clearError(field);
    }
  }
  form.addEventListener('input', clearIfValidNow);
  form.addEventListener('change', clearIfValidNow);

  /* Si llegamos acá es porque la validación nativa ya aprobó todos los campos
     (el navegador no dispara "submit" si hay alguno inválido). */
  form.addEventListener('submit', function (e) {
    e.preventDefault(); /* esta página no tiene backend real: simulamos la confirmación de envío */

    status.textContent = 'Mensaje enviado correctamente. Te responderemos dentro de dos días hábiles.';

    form.reset();
    Array.prototype.forEach.call(form.elements, clearError); /* limpia cualquier error que hubiera quedado de un intento previo */

    status.focus(); /* asegura que el lector de pantalla anuncie la confirmación ya mismo, sin depender solo del aria-live */
  });

})();
