const botonAnadirProducto = document.querySelector('#BotonAnadirProducto')
const popupFormAnadirProducto = document.querySelector(
  '#PopupFormAnadirProducto'
)
const BotonesOpenPopupLinks = document.querySelectorAll('.open_popup_links')
const BotonesClosePopupLinks = document.querySelectorAll('.close_popup_links')
const BotonesOpenPopupEditar = document.querySelectorAll('.open_popup_editar')
const BotonesClosePopupEditar = document.querySelectorAll('.close_popup_editar')
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
      let popup = document.querySelector(`dialog.dialog_links[data-id="${id}"]`)
      popup.showModal()
    })
  })
}

if (BotonesClosePopupLinks && BotonesClosePopupLinks.length > 0) {
  BotonesClosePopupLinks.forEach((boton) => {
    boton.addEventListener('click', () => {
      let id = boton.dataset.id
      let popup = document.querySelector(`dialog.dialog_links[data-id="${id}"]`)
      popup.close()
    })
  })
}
if (BotonesOpenPopupEditar && BotonesOpenPopupEditar.length > 0) {
  BotonesOpenPopupEditar.forEach((boton) => {
    boton.addEventListener('click', () => {
      let id = boton.dataset.id
      let popup = document.querySelector(
        `dialog.dialog_editar[data-id="${id}"]`
      )
      popup.showModal()

      let linksTextarea = popup.querySelector('textarea[name="links"]')
      let inputLinks = popup.querySelector('#input_link_links')
      let imagesTextarea = popup.querySelector('textarea[name="images"]')
      let inputImages = popup.querySelector('#input_link_images')

      if (linksTextarea.textContent !== '') {
        let value = linksTextarea.textContent
        linksTextarea.textContent = ''

        let arrayLinks = value.split(', ')
        arrayLinks.forEach(link => {
          inputLinks.value = link
          insertLink(inputLinks)
        })
        inputLinks.value = ''
      }
      if (imagesTextarea.textContent !== '') {
        let value = imagesTextarea.textContent
        imagesTextarea.textContent = ''

        let arrayLinks = value.split(', ')
        arrayLinks.forEach((link) => {
          inputImages.value = link
          insertImage(inputImages)
        })
        inputImages.value = ''
      }
    })
  })
}

if (BotonesClosePopupEditar && BotonesClosePopupEditar.length > 0) {
  BotonesClosePopupEditar.forEach((boton) => {
    boton.addEventListener('click', () => {
      let id = boton.dataset.id
      let popup = document.querySelector(
        `dialog.dialog_editar[data-id="${id}"]`
      )
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
            alert('Hubo un error al cambiar el estado del producto.')
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
              alert('Hubo un error al cambiar el estado del producto.')
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



function deleteProduct(id) {
  let dialog = document.createElement('dialog')
  let section = document.createElement('section')
  let titulo = document.createElement('h2')
  let text = document.createElement('span')
  let divBotones = document.createElement('div')
  let botonConfirmar = document.createElement('button')
  let botonCancelar = document.createElement('button')

  dialog.classList.add('tipo_confirmacion')

  botonConfirmar.type = 'button'
  botonCancelar.type = 'button'

  titulo.textContent = 'MODIFICAR ESTADO'
  text.textContent = 'Se va a proceder a borrar el producto. ¿Desea proceder?'
  botonConfirmar.textContent = 'Si'
  botonCancelar.textContent = 'No'

  // TAILWIND CLASSES
  dialog.classList.add('bg-orange-100')
  botonConfirmar.classList.add('bg-emerald-300')
  botonCancelar.classList.add('bg-red-300')

  const handleConfirm = () => {
    const productoId = id
    const csrfToken = getCookie('csrftoken')

    fetch(`/api/borrar_producto/${productoId}/`, {
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
        alert('Hubo un error al borrar el producto.')
      }
    })
    .catch((error) => console.error('Error:', error))
  }

  botonCancelar.addEventListener('click', () => {
    dialog.remove()
  })

  botonConfirmar.addEventListener('click', handleConfirm)
  botonConfirmar.addEventListener('touchend', handleConfirm)
  botonConfirmar.addEventListener('pointerdown', (e) => e.preventDefault())

  divBotones.insertAdjacentElement('beforeend', botonConfirmar)
  divBotones.insertAdjacentElement('beforeend', botonCancelar)
  section.insertAdjacentElement('beforeend', titulo)
  section.insertAdjacentElement('beforeend', text)
  section.insertAdjacentElement('beforeend', divBotones)
  dialog.insertAdjacentElement('beforeend', section)
  document.body.appendChild(dialog)
  dialog.showModal()
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


//== INSERT LINKS AND IMAGES

function insertImage(input) { 
  let link = input.value
  let parentInputLink = input.parentElement.parentElement
  let textAreaLinks = parentInputLink.querySelector('#id_images')
  let wrapper = input.parentElement.nextElementSibling

  let newDiv = document.createElement('div')
  let newImg = document.createElement('img')
  let removeButton = document.createElement('button')
  newImg.src = link
  removeButton.type = 'button'
  removeButton.innerHTML = '&times;'

  // TAILWINDCSS
  newImg.classList.add('object-cover')
  newImg.classList.add('w-[5rem]')
  newImg.classList.add('h-[5rem]')

  if (textAreaLinks.textContent === '') {
    textAreaLinks.textContent += link
  } else {
    textAreaLinks.textContent += `, ${link}`
  }

  removeButton.addEventListener('click', () => {
    newDiv.remove()
    let valueTextArea = textAreaLinks.textContent.split(', ')

    if (valueTextArea.includes(link)) {
      valueTextArea = valueTextArea.filter((el) => el !== link)
      textAreaLinks.textContent = valueTextArea.join(', ')
    }
  })

  newDiv.appendChild(newImg)
  newDiv.appendChild(removeButton)
  wrapper.appendChild(newDiv)
  input.value = ''
}
function insertLink(input) {
  let link = input.value
  let parentInputLink = input.parentElement.parentElement
  let textAreaLinks = parentInputLink.querySelector('#id_links')
  let wrapper = input.parentElement.nextElementSibling

  let newDiv = document.createElement('div')  
  let newImg = document.createElement('img')
  let newSpan = document.createElement('span')
  let removeButton = document.createElement('button')
  let domain = new URL(link).hostname
  let partsDomain = domain.split('.')
  newImg.src = `https://${domain}/favicon.ico`
  newSpan.textContent = partsDomain.slice(-2).join('.')

  removeButton.type = 'button'
  removeButton.innerHTML = '&times;'

  // TAILWINDCSS
  newDiv.classList.add('flex')
  newDiv.classList.add('flex-col')
  newDiv.classList.add('justify-center')
  newDiv.classList.add('items-center')
  newSpan.classList.add('text-lg')
  newImg.classList.add('object-cover')
  newImg.classList.add('w-[5rem]')
  newImg.classList.add('h-[5rem]')

  if (textAreaLinks.textContent === '') {
    textAreaLinks.textContent += link
  } else {
    textAreaLinks.textContent += `, ${link}`
  }

  removeButton.addEventListener('click', () => {
    newDiv.remove()
    let valueTextArea = textAreaLinks.textContent.split(', ')

    if (valueTextArea.includes(link)) {
      valueTextArea = valueTextArea.filter((el) => el !== link)
      textAreaLinks.textContent = valueTextArea.join(', ')
    }
  })

  newDiv.appendChild(newImg)
  newDiv.appendChild(newSpan)
  newDiv.appendChild(removeButton)
  wrapper.appendChild(newDiv)
  input.value = ''
}