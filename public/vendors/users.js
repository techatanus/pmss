document.getElementById("myForm").addEventListener("submit", function(event) {
    // Prevent form submission until validation is complete
    event.preventDefault();

    // Get form field values
    let userName = document.getElementById("userName").value.trim();
    let userEmail = document.getElementById("userEmail").value.trim();
    let userRole = document.getElementById("userRole").value.trim();
  
    // Validate userName (No special characters)
    if (!/^[a-zA-Z\s]+$/.test(userName)) {
        alert("Invalid userName. Please use only letters and spaces.");
        return;
    }


    // Validate Email
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        alert("Invalid email address.");
        return;
    }


       // Validate userRole (No special characters)
       if (!/^[a-zA-Z\s]+$/.test(userRole)) {
        alert("Invalid user Role. Please use only letters and spaces.");
        return;
    }

   
    // If all validations pass, submit the form
    alert("Form is valid! Submitting...");
    event.target.submit();
});
