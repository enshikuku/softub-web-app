let cartCounter = document.querySelector('#cart-counter')
let cartItems = document.querySelector('#cart-items')
var cartid = []
function addinputandcartcount(id) {
    cartCounter.innerHTML = parseInt(cartCounter.innerHTML) + 1
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