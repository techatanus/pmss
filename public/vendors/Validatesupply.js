document.getElementById("myForm").addEventListener("submit", function(event) {
    // Prevent form submission until validation is complete
    event.preventDefault();

    // Get form field values
    let supplierName = document.getElementById("supplierName").value.trim();
    let contact = document.getElementById("contact").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let email = document.getElementById("email").value.trim();
  

    // Validate Name (No special characters)
    if (!/^[a-zA-Z\s]+$/.test(supplierName)) {
        alert("Invalid supplierName. Please use only letters and spaces.");
        return;
    }


    // Validate Name (No special characters)
    if (!/^[a-zA-Z\s]+$/.test(contact)) {
        alert("Invalid contact name. Please use only letters and spaces.");
        return;
    }

    // Validate Phone (Digits only)
    if (!/^\d{10,15}$/.test(phone)) {
        alert("Invalid phone number. Please use 10-15 digits.");
        return;
    }

    // Validate Email
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Invalid email address.");
        return;
    }

  

    // If all validations pass, submit the form
    alert("Form is valid! Submitting...");
    event.target.submit();
});
