// ---------------- zetaclients ------------------------------
async function zetaclients_versions() {
    let IPs = ["52.42.64.63", "150.136.176.81", "202.8.10.137",
	       "34.239.99.239",
	       "3.218.170.198",
	       "18.210.106.52",
	       "44.236.174.26",
	       "35.162.231.114",
	       "54.77.180.134",
	       "34.253.137.241",
	       "18.143.71.236",
	       "54.254.133.239",
	       // "3.218.170.198",
	       // "34.239.99.239",
	       // "18.210.106.52",
	       // "35.162.231.11",
	       // "44.236.174.26",
	       // "54.77.180.134",
	       // "34.253.137.24",
	       // "18.143.71.236",
	       // "54.254.133.23",
	      ];
    let ipAPI = "http://ip-api.com/json";
    try {
	let div = document.getElementById('zetaclients-summary');
	console.log(div);

	let fetchPromises = [];
	let p2pPromises = [];
	let geoPromises = [];
	let checkPromises = [];
	for (let i=0; i<IPs.length; i++) {
	    fetchPromises.push(fetch(`${corsProxyURL}/http://${IPs[i]}:8123/version`, {method: 'GET'}));
	    p2pPromises.push(fetch(`${corsProxyURL}/http://${IPs[i]}:8123/p2p`, {method: 'GET'}));
	    geoPromises.push(fetch(`${ipAPI}/${IPs[i]}`, {method: 'GET'}));
	    checkPromises.push(fetch(`${checkURL}/check?ip=${IPs[i]}`, {method: 'GET'}));
	}


	let table = document.createElement('table');

	let thead = document.createElement('thead');
	table.replaceChildren(thead);
	let headRow = document.createElement('tr');
	thead.replaceChildren(headRow);
	let th1 = document.createElement('th');
	th1.innerText = "IP";
	headRow.appendChild(th1);
	let th2 = document.createElement('th');
	th2.innerText = "Version";
	headRow.appendChild(th2);
	let th3 = document.createElement('th');
	th3.innerText = "P2P Peer ID";
	headRow.appendChild(th3);
	let th4 = document.createElement('th');
	th4.innerText = "Geolocation";
	headRow.appendChild(th4);
	let th5 = document.createElement('th');
	th5.innerText = "Org";
	headRow.appendChild(th5);
	let th6 = document.createElement('th');
	th6.innerText = "Check P2P";
	headRow.appendChild(th6);

	
	div.appendChild(table);

	for (let i=0; i<IPs.length; i++) {
	    let tr = document.createElement('tr');
	    table.appendChild(tr);
	    let td1 = document.createElement('td');
	    td1.innerText = IPs[i];
	    let td2 = document.createElement('td');
	    td2.id = `zetaclients-version-${i}`;
	    let td3 = document.createElement('td');
	    td3.id = `zetaclients-peerid-${i}`;
	    let td4 = document.createElement('td');
	    td4.id = `zetaclients-geolocation-${i}`;
	    let td5 = document.createElement('td');
	    td5.id = `zetaclients-org-${i}`;
	    let td6 = document.createElement('td');
	    td6.id = `zetaclients-check-${i}`;
	    tr.appendChild(td1);
	    tr.appendChild(td2);
	    tr.appendChild(td3);
	    tr.appendChild(td4);
	    tr.appendChild(td5);
	    tr.appendChild(td6);
	}

	for (let i=0; i<IPs.length; i++) {
	    let p1 = await fetchPromises[i];
	    if (!p1.ok) {
		console.log("Error " + p1.status);
		continue;
	    }
	    let data = await p1.text();
	    let td = document.getElementById(`zetaclients-version-${i}`);
	    td.innerText = data;

	    let p2 = await p2pPromises[i];
	    if (!p2.ok) {
		console.log("Error " + p2.status);
		continue;
	    }
	    let data2 = await p2.text();
	    let td2 = document.getElementById(`zetaclients-peerid-${i}`);
	    td2.innerText = data2;

	    let p4 = await checkPromises[i];
	    if (!p4.ok) {
		console.log("Error " + p4.status);
		continue;
	    }
	    let data4 = await p4.text();
	    let td5 = document.getElementById(`zetaclients-check-${i}`);
	    td5.innerText = data4;
	    

	    let p3 = await geoPromises[i];
	    if (!p3.ok) {
		console.log("Error " + p3.status);
		continue;
	    }
	    let data3 = await p3.json();
	    let td3 = document.getElementById(`zetaclients-geolocation-${i}`);
	    td3.innerText = `${data3.city}, ${data3.country}`;
	    let td4 = document.getElementById(`zetaclients-org-${i}`);
	    td4.innerText = data3.org;

	}
    } catch (error) {
	console.log("Error " + error);
    }
}

zetaclients_versions();


// render a table showing gas price updates from zetaclients
async function gasPriceHeartBeats() {
    const chainIds = [5, 97, 80001];
    for (let i=0; i<chainIds.length; i++) {
	const chainId = chainIds[i];
	const resource = `zeta-chain/crosschain/gasPrice/${chainId}`;
	const url = `${nodeURL}/${resource}`;
	let p = await fetch(url, {method: 'GET'});
	if (!p.ok) {
	    console.log("Error " + p.status);
	    continue;
	}
	let data = await p.json();
	console.log(data.GasPrice.block_nums);
    }
}

gasPriceHeartBeats();
