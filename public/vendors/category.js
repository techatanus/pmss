document.getElementById("myForm").addEventListener("submit", function(event) {
    // Prevent form submission until validation is complete
    event.preventDefault();

    // Get form field values
    let supplierName = document.getElementById("supplierName").value.trim();
 
   // Validate supplierName (No special characters)
    if (!/^[a-zA-Z\s]+$/.test(supplierName)) {
        alert("Invalid supplierName. Please use only letters and spaces.");
        return;
    }
 

    // If all validations pass, submit the form
    alert("Form is valid! Submitting...");
    event.target.submit();
});
