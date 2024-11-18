$(document).ready(function () {
    // const TAX_RATE = 0.16; // 16% tax rate
     const encryptionKey = '3ncryption@key'; // Replace with your encryption key
 
     // Load and decrypt cart items from local storage
     let encryptedCartItems = localStorage.getItem('cartItems');
     document.getElementById('encryptedCartItems').value=encryptedCartItems;
     let cartItems = [];
 
     if (encryptedCartItems) {
         try {
             const bytes = CryptoJS.AES.decrypt(encryptedCartItems, encryptionKey);
             const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
             cartItems = JSON.parse(decryptedData) || [];
             console.log(cartItems);
         } catch (error) {
             console.error('Error parsing cart items: ', error);
         }
     }
 
     renderCartItems(cartItems);
     updatePaymentValue(cartItems);
 
     // Event listener for input in the item search field
     $('#itemSearch').on('input', function () {
         const searchTerm = $(this).val().trim();
 
         if (searchTerm.length > 0) {
             $.ajax({
                 url: '/search-products',
                 method: 'GET',
                 data: { term: searchTerm },
                 success: function (data) {
                     $('#suggestions').empty();
                     data.forEach(product => {
                         $('#suggestions').append(`
                        
                             <a href="#" class="list-group-item list-group-item-action" data-id="${product.p_id}" data-name="${product.p_name}" data-bp="${product.p_bp}" data-sp="${product.p_sp}" data-wp="${product.p_wp}" data-quantity="${product.p_quantity}">
                                 ${product.p_name} - Price: ${product.p_sp} -quantity: ${product.p_quantity}
                                 
                             </a>
                         `);
                     });
                 },
                 error: function (xhr, status, error) {
                     console.error('AJAX Error:', status, error);
                 }
             });
         } else {
             $('#suggestions').empty();
         }
     });
 
     // Event listener for clicking a suggestion
     $('#suggestions').on('click', 'a', function (e) {
         e.preventDefault();
         const product = {
             id: $(this).data('id'),
             name: $(this).data('name'),
             sp: parseFloat($(this).data('sp')),
             bp: parseFloat($(this).data('bp')),
             wp: parseFloat($(this).data('wp')),
             quantity: 1,
             //discount: 0
         };
 
         addItemToCart(product);
         $('#itemSearch').val('');
         $('#suggestions').empty();
     });
 
     // Add item to cart and save to local storage
     function addItemToCart(product) {
         cartItems.push(product);
         saveCartItems();
         renderCartItems(cartItems);
         updatePaymentValue(cartItems);
     }
 
     // Render cart items in the table
     function renderCartItems(items) {
         $('#cartContents').empty();
         items.forEach((item, index) => {
             const totalPrice = calculateTotalPrice(item.sp, item.quantity, item.discount);
             $('#cartContents').append(`
                 <tr data-index="${index}">
                     <td><button class="btn btn-danger btn-sm delete-item">Delete</button></td>
                     <td>${item.id}</td>
                     <td>${item.name}</td>
                     <td class="price">${item.sp}</td>
                     <td><input type="number" class="form-control quantity" value="${item.quantity}" min="1"></td>
                     <!--td>
                         <select class="form-control discount">
                             <option value="0" ${item.discount == 0 ? 'selected' : ''}>x0</option>
                             <option value="10" ${item.discount == 10 ? 'selected' : ''}>x10</option>
                             <option value="20" ${item.discount == 20 ? 'selected' : ''}>x20</option>
                         </select>
                     </td-->
                     <td class="total">${totalPrice.toFixed(2)}</td>
                 </tr>
             `);
         });
 
         // Event listeners for dynamically updating quantity and discount
         $('.quantity, .discount').on('change', function () {
             const index = $(this).closest('tr').data('index');
             const quantity = parseInt($(this).closest('tr').find('.quantity').val());
             // const discount = parseInt($(this).closest('tr').find('.discount').val());
 
             cartItems[index].quantity = quantity;
             // cartItems[index].discount = discount;
 
             saveCartItems();
             renderCartItems(cartItems);
             updatePaymentValue(cartItems);
         });
 
         // Event listener for deleting an item
         $('.delete-item').on('click', function () {
             const index = $(this).closest('tr').data('index');
             cartItems.splice(index, 1);
             saveCartItems();
             renderCartItems(cartItems);
             updatePaymentValue(cartItems);
         });
     }
 
     // Calculate the total price including tax and discount
     function calculateTotalPrice(price, quantity, discount) {
         // const discountedPrice = price - (price * (discount / 100));
         // const totalPrice = discountedPrice * quantity * (1 + TAX_RATE);
         const totalPrice = price * quantity;
         return totalPrice;
     }
 
     // Save and encrypt cart items to local storage
     function saveCartItems() {
         const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(cartItems), encryptionKey).toString();
         localStorage.setItem('cartItems', encryptedData);
     }
 
     // Update the payment value field
     function updatePaymentValue(items) {
         let totalPayment = 0;
         items.forEach(item => {
             totalPayment += calculateTotalPrice(item.sp, item.quantity, item.discount);
         });
         $('#paymentValue').val(`${totalPayment.toFixed(2)}`);
     }

        // Event listener for canceling the receipt
        $('#cancelReceiptButton').on('click', function () {
            if (confirm('Are you sure you want to cancel the receipt?')) {
                cartItems.length = 0; // Clear the cart
                saveCartItems();
                renderCartItems(cartItems);
            }
        });


 });
 
