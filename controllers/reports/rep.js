function filterTable() {
    //  get input dates
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    // get table rows
    const table = document.getElementById('salesT').getElementsByTagName('tbody')[0];
    const rows = table.getElementsByTagName('tr');

    // loop through the row and hide those that do not match the date range
    for(let i =0; i<rows.length; i++){
        const dateCell = rows[1].getElementsByTagName('td')[0];
        const rowDate =  newDate(dateCell.textContent);//convert to date Object
    // show or hide based on date range
      if(rowDate >= startDate&&rowDate <= endDate){
        rows[i].style.display='';
      }else{
        rows[i].style.display='none';
      }
    }
}
