document.getElementById("myForm").addEventListener("submit", function(event) {
    // Prevent form submission until validation is complete
    event.preventDefault();

    // Get form field values
   // let supplierName = document.getElementById("supplierName").value.trim();
    let itemName = document.getElementById("itemName").value.trim();
    let userRole = document.getElementById("userRole").value.trim();
    let price = document.getElementById("price").value.trim();
    // let csv = document.getElementById("csv").files[0];
    // let images = document.getElementById("images").files;
    // let file = document.getElementById("file").files[0];
    // let password = document.getElementById("password").value.trim();
     let expd = document.getElementById("expd").value;
    // let numbers = document.getElementById("numbers").value.trim();

    // Validate supplierName (No special characters)
    // if (!/^[a-zA-Z\s]+$/.test(supplierName)) {
    //     alert("Invalid supplierName. Please use only letters and spaces.");
    //     return;
    // }
    // item name
    if (!/^[a-zA-Z\s]+$/.test(itemName)) {
        alert("Invalid itemName. Please use only letters and spaces.");
        return;
    }
    // user role
    if (!/^[a-zA-Z\s]+$/.test(userRole)) {
        alert("Invalid userRole. Please use only letters and spaces.");
        return;
    }
    // price
    if (!/^\d+$/.test(price)) {
        alert("Invalid input for price. Please use positive integers only.");
        return;
    }

    // Validate Date (ISO format or other specific format)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expd)) {
        alert("Invalid expd. Please use the format YYYY-MM-DD.");
        return;
    }

    // If all validations pass, submit the form
    alert("Form is valid! Submitting...");
    event.target.submit();
});
