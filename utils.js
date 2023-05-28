function base64ToUtf8(base64String) {
    if (base64String == null) {
	return "null";
    }
    const binaryString = atob(base64String);

    return binaryString;
}


function toggleDropdown(dropdownId) {
    var dropdown = document.getElementById(dropdownId);
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
  }


// Function to add commas to a number string so "1234567" will
// turn into "1,234,567"
function addCommas(numberString) {
    var parts = numberString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// simple utility to turn a JSON object into a HTML table element;
// two columns: "JSON key", "JSON value";
// each row is a field in JSON object. 
function makeTableElement(json) {
    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
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

// given a JSON array, turn it into a table; each row is
// one element in JSON array; each column is a field;
// the list of interested fields are specified by the fields
// string array
function makeTableElement2(jsonArray, fields) {
    // create a table
    var table = document.createElement('table');

    // create table header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    fields.forEach(header => {
	var th = document.createElement('th');
	th.textContent = header;
	headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // create table body
    var tbody = document.createElement('tbody');

    // iterate over the JSON object
    jsonArray.forEach( row => {
	// console.log("row", row);
	// create a row for each field
	var tr = document.createElement('tr');

	fields.forEach( field => {
	    var td = document.createElement('td');
	    td.textContent = row[field];
	    tr.appendChild(td);
	});
	table.appendChild(tr);
    });

    // append the body to the table
    table.appendChild(tbody);

    // append the table to the body of the page
    return table; 

}



function utcToLocal(utcString) {
    let utcDate = new Date(utcString);
    return utcDate.toLocaleString();
}
