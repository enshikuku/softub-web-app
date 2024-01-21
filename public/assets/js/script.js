let cartCounter = document.querySelector('#cart-counter')
let cartItems = document.querySelector('#cart-items')
let added = document.querySelector('.item-added')
var cartid = []
function addinputandcartcount(id) {
    cartCounter.innerHTML = parseInt(cartCounter.innerHTML) + 1
    added.style.display = 'block'
    setTimeout(function() {
        added.style.display = 'none'
    }, 2000)
    if (cartid.includes(id)) {
        let input = document.querySelector(`input[name="${id}"]`)
        input.value = parseInt(input.value) + 1
        return
    } else {
        let input = document.createElement('input')
        input.type = 'hidden'
        input.value = 1
        input.name = id
        cartItems.appendChild(input)
        cartid.push(id)
    }
}