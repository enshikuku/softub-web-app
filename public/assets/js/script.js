let cartCounter = document.querySelector('#cart-counter')
let added = document.querySelector('.item-added')
function addcartcount() {
    added.style.display = 'block'
    setTimeout(function() {
        added.style.display = 'none'
    }, 2000)
    cartCounter.innerHTML = parseInt(cartCounter.innerHTML) + 1
}