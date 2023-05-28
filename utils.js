// Function to add commas to a number string
function addCommas(numberString) {
    var parts = numberString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function makeTableElement(json) {
    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
    // var headerRow = document.createElement('tr');

    // var th1 = document.createElement('th');
    // th1.textContent = "Field";
    // headerRow.appendChild(th1);

    // var th2 = document.createElement('th');
    // th2.textContent = "Value";
    // headerRow.appendChild(th2);

    // thead.appendChild(headerRow);
    table.appendChild(thead);

    // create table body
    var tbody = document.createElement('tbody');

    // iterate over the JSON object
    for (var field in json) {
	// create a row for each field
	var tr = document.createElement('tr');
	
	// create a cell for the field name
	var td1 = document.createElement('td');
	td1.textContent = field;
	tr.appendChild(td1);
	
	// create a cell for the field value
	var td2 = document.createElement('td');
	td2.textContent = json[field];
	tr.appendChild(td2);
	
	// add the row to the table body
	tbody.appendChild(tr);
    }

    // append the body to the table
    table.appendChild(tbody);

    // append the table to the body of the page
    return table; 

}
