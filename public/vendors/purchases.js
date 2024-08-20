document.getElementById("myForm").addEventListener("submit", function(event){
    //   prevent form submission untill validation is complete
    event.preventDefault();

    // get form field values
    let productName = document.getElementById('productName').value.trim();
    let buyingPrice = document.getElementById('buyingPrice').value.trim();
    let sellingPrice = document.getElementById('sellingPrice').value.trim();
   let  wholesalePrice =document.getElementById('wholesalePrice').value.trim();
   let productStock = document.getElementById('productStock').value.trim();
    let csv = document.getElementById("csv").files[0];
    // validate productName
    if(!/^[a-zA-Z\s]+$/.test(productName)){
        alert("Invalid Name. Please use only letters and spaces")
        return;
    };
//   validate buyingPrices (positive integer only)
          // Validate buyingPrices (Positive integer only)
    if (!/^\d+$/.test(buyingPrice)) {
        alert("Invalid input for buyingPrices. Please use positive integers only.");
        return;
    }
    // selling price
    if (!/^\d+$/.test(sellingPrice)) {
        alert("Invalid input for sellingPrice. Please use positive integers only.");
        return;
    }
    // wholesaleprice
    if (!/^\d+$/.test(wholesalePrice)) {
        alert("Invalid input for wholesalePrice. Please use positive integers only.");
        return;
    }
    // productStock validation
    if (!/^\d+$/.test(productStock)) {
        alert("Invalid input for productStock. Please use positive integers only.");
        return;
    }
    // csv file validation
    if (csv && csv.type !== "text/csv") {
        alert("Invalid file type for csv. Please upload a csv file.");
        return;
    }


      // If all validations pass, submit the form
      alert("Form is valid! Submitting...");
      event.target.submit();
})