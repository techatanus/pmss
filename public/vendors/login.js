document.getElementById("myForm").addEventListener("submit", function(event){
    //   prevent form submission untill validation is complete
    event.preventDefault();

    // get form field values
    let username = document.getElementById('username').value.trim();
    let password = document.getElementById('passwordInput').value.trim();

    // validate name
    if(!/^[a-zA-Z\s]+$/.test(username)){
        alert("Invalid username. Please use only letters and spaces")
        return;
    };
    // Validate Password (Strong password)
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{4,}$/;
    if (!passwordRegex.test(password)) {
        alert("Password must be at least 4 characters long and include a mix of uppercase, lowercase, numbers, and special characters.");
        return;
    }


      // If all validations pass, submit the form
      alert("Form is valid! Submitting...");
      event.target.submit();
})