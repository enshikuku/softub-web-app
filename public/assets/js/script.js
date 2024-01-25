let cartCounter = document.querySelector('#cart-counter')
let added = document.querySelector('.item-added')
function addcartcount() {
    let selectedQuantity = parseInt(document.getElementById('quantity').value)
    
    added.style.display = 'block'
    setTimeout(function() {
        added.style.display = 'none'
    }, 4000)

    cartCounter.innerHTML = parseInt(cartCounter.innerHTML) + selectedQuantity
}

function addToCart(event) {
    event.preventDefault()

    const formData = new FormData(event.target)
    const formObject = {}
    
    formData.forEach((value, key) => {
        formObject[key] = value
    })

    fetch('/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formObject)
    })
    .then(response => response.json()) 
    .then(data => {
        console.log(data)
        
    })
    .catch(error => {
        console.error('Error:', error)
    })
}
