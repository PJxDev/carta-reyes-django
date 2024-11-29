const botonAnadirProducto = document.querySelector('#BotonAnadirProducto')
const popupFormAnadirProducto = document.querySelector(
  '#PopupFormAnadirProducto'
)
const BotonesOpenPopupLinks = document.querySelectorAll('.open_popup_links')
const BotonesClosePopupLinks = document.querySelectorAll('.close_popup_links')
const BotonesPillarProducto = document.querySelectorAll('.btn_pillar_producto')
const BotonesDespillarProducto = document.querySelectorAll(
  '.btn_despillar_producto'
)
const Carousels = document.querySelectorAll('.carousel')

if (botonAnadirProducto)
  botonAnadirProducto.addEventListener('click', () => {
    popupFormAnadirProducto.showModal()
  })

if (BotonesOpenPopupLinks && BotonesOpenPopupLinks.length > 0) {
  BotonesOpenPopupLinks.forEach((boton) => {
    boton.addEventListener('click', () => {
      let id = boton.dataset.id
      let popup = document.querySelector(`dialog[data-id="${id}"]`)
      popup.showModal()
    })
  })
}
if (BotonesClosePopupLinks && BotonesClosePopupLinks.length > 0) {
  BotonesClosePopupLinks.forEach((boton) => {
    boton.addEventListener('click', () => {
      let id = boton.dataset.id
      let popup = document.querySelector(`dialog[data-id="${id}"]`)
      popup.close()
    })
  })
}
if (BotonesPillarProducto && BotonesPillarProducto.length > 0) {
  BotonesPillarProducto.forEach((button) => {
    button.addEventListener('click', function () {
      const productoId = button.dataset.productoId
      const csrfToken = getCookie('csrftoken')

      fetch(`/api/pillar_producto/${productoId}/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': `${csrfToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            navigation.reload()
          } else {
            alert('Hubo un error al cambiar el estado.')
          }
        })
        .catch((error) => console.error('Error:', error))
    })
  })
}
if (BotonesDespillarProducto && BotonesDespillarProducto.length > 0) {
  BotonesDespillarProducto.forEach((button) => {
    button.addEventListener('click', function () {
      let dialog = document.createElement('dialog')
      let section = document.createElement('section')
      let titulo = document.createElement('h2')
      let text = document.createElement('span')
      let divBotones = document.createElement('div')
      let botonConfirmar = document.createElement('button')
      let botonCancelar = document.createElement('button')

      dialog.classList.add('tipo_confirmacion')

      titulo.textContent = 'MODIFICAR ESTADO'
      text.textContent =
        'Se va a proceder a cambiar el estado de este producto. ¿Desea proceder?'
      botonConfirmar.textContent = 'Si'
      botonCancelar.textContent = 'No'

      // TAILWIND CLASSES
      dialog.classList.add('bg-orange-100')
      botonConfirmar.classList.add('bg-emerald-300')
      botonCancelar.classList.add('bg-red-300')

      botonCancelar.addEventListener('click', () => {
        dialog.remove()
      })
      botonConfirmar.addEventListener('click', () => {
        const productoId = button.dataset.productoId
        const csrfToken = getCookie('csrftoken')

        fetch(`/api/despillar_producto/${productoId}/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': `${csrfToken}`,
            'Content-Type': 'application/json'
          }
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              navigation.reload()
            } else {
              alert('Hubo un error al cambiar el estado.')
            }
          })
          .catch((error) => console.error('Error:', error))
      })

      divBotones.insertAdjacentElement('beforeend', botonConfirmar)
      divBotones.insertAdjacentElement('beforeend', botonCancelar)
      section.insertAdjacentElement('beforeend', titulo)
      section.insertAdjacentElement('beforeend', text)
      section.insertAdjacentElement('beforeend', divBotones)
      dialog.insertAdjacentElement('beforeend', section)
      document.body.appendChild(dialog)
      dialog.showModal()
    })
  })
}

//== CAROUSELS

if (Carousels && Carousels.length > 0) {
  Carousels.forEach((carousel) => {
    let slides = carousel.querySelector('.carousel-slides')
    let slideCount = slides.querySelectorAll('.slide').length
    let prevButton = carousel.querySelector('.prev')
    let nextButton = carousel.querySelector('.next')

    let currentIndex = 0

    prevButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slideCount) % slideCount
      updateCarousel({ slides, currentIndex })
    })

    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slideCount
      updateCarousel({ slides, currentIndex })
    })
  })
}

function updateCarousel({ slides, currentIndex }) {
  const offset = -currentIndex * 100
  slides.style.transform = `translateX(${offset}%)`
}

//==== Helpers
function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}
