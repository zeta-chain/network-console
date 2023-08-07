import {decode, encode, convertbits, encodings} from './bech32.js';
import {addDetails, nodeURL, RPCByChainID, corsProxyURL, checkURL, esploraAPIURL} from './common.js';

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
	      ];
    let ChainIDs = [5, 97, 80001, 18332]; 
    let ipAPI = "http://ip-api.com/json";
    try {
	let div = document.getElementById('zetaclients-summary');
	console.log(div);

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
	// headRow.appendChild(th3);
	let th4 = document.createElement('th');
	th4.innerText = "Geolocation";
	headRow.appendChild(th4);
	let th5 = document.createElement('th');
	th5.innerText = "Org";
	headRow.appendChild(th5);
	let th6 = document.createElement('th');
	th6.innerText = "Check P2P";
	headRow.appendChild(th6);
	let th7 = document.createElement('th');
	th7.innerText = "Last Start Timestamp";
	headRow.appendChild(th7);
	let th8 = document.createElement('th');
	th8.innerText = "Last Scanned Blocks";
	th8.colSpan = ChainIDs.length;
	headRow.appendChild(th8);
	let th9 = document.createElement('th');
	th9.innerText = "Num UTXOs";
	headRow.appendChild(th9);
	let th10 = document.createElement('th');
	th10.innerText = "Next UTXO Nonce";
	headRow.appendChild(th10);
	let headRow2 = document.createElement('tr');
	thead.appendChild(headRow2);
	{
	    let th = document.createElement('th');
	    th.innerText = "";
	    th.colSpan = 6;
	    headRow2.appendChild(th);
	}
	for (let i=0; i<ChainIDs.length; i++) {
	    let th = document.createElement('th');
	    th.innerText = ChainIDs[i];
	    headRow2.appendChild(th);
	}
	
	
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
	    let td7 = document.createElement('td');
	    td7.id = `zetaclients-laststart-${i}`;
	    tr.appendChild(td1);
	    tr.appendChild(td2);
	    tr.appendChild(td4);
	    tr.appendChild(td5);
	    tr.appendChild(td6);
	    tr.appendChild(td7);

	    for (let j=0; j<ChainIDs.length; j++) {
		let td8 = document.createElement('td');
		td8.id = `zetaclients-lastscanned-${i}-${ChainIDs[j]}`;
		tr.appendChild(td8);
	    }
	    {
		let td8 = document.createElement('td');
		td8.id = `zetaclients-numutxos-${i}`;
		tr.appendChild(td8);
		let td9 = document.createElement('td');
		td9.id = `zetaclients-next-utxo-nonce-${i}`;
		tr.appendChild(td9);
	    }

	}

	let lastscannedPromises = [];
	for (let i=0; i<IPs.length; i++) {
	    fetch(`${corsProxyURL}/http://${IPs[i]}:8123/status`, {method: 'GET'})
	    	.then(response => {
		    if (response.ok) {
			return response.json();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    // console.log("status", data);
		    let td = document.getElementById(`zetaclients-numutxos-${i}`);
		    td.innerText = data.btc_number_of_utxos;
		    td = document.getElementById(`zetaclients-next-utxo-nonce-${i}`);
		    td.innerText = data.btc_next_nonce;
		}).catch(err => {
		    console.log(err);
		});

	    fetch(`${corsProxyURL}/http://${IPs[i]}:8123/version`, {method: 'GET'})
		.then(response => {
		    if (response.ok) {
			return response.text();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    let td = document.getElementById(`zetaclients-version-${i}`);
		    td.innerText = data;
		}).catch(err => {
		    console.log(err);
		});

	    // p2pPromises.push(fetch(`${corsProxyURL}/http://${IPs[i]}:8123/p2p`, {method: 'GET'}));
	    fetch(`${ipAPI}/${IPs[i]}`, {method: 'GET'})
	    	.then(response => {
		    if (response.ok) {
			return response.json();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    let td = document.getElementById(`zetaclients-geolocation-${i}`);
		    td.innerText = `${data.country} ${data.regionName} ${data.city}`;
		    let td2 = document.getElementById(`zetaclients-org-${i}`);
		    td2.innerText = data.org;
		}).catch(err => {
		    console.log(err);
		});
	    fetch(`${checkURL}/check?ip=${IPs[i]}`, {method: 'GET'})
	    	.then(response => {
		    if (response.ok) {
			return response.text();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    let td = document.getElementById(`zetaclients-check-${i}`);
		    td.innerText = data;
		}).catch(err => {
		    console.log(err);
		});
	    fetch(`${corsProxyURL}/http://${IPs[i]}:8123/laststarttimestamp`, {method: 'GET'})
	    	.then(response => {
		    if (response.ok) {
			return response.text();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    let td = document.getElementById(`zetaclients-laststart-${i}`);
		    const d = new Date(data);
		    td.innerText = d.toLocaleString();
		}).catch(err => {
		    console.log(err);
		});
	    fetch(`${corsProxyURL}/http://${IPs[i]}:8123/lastscannedblock`, {method: 'GET'})
	    	.then(response => {
		    if (response.ok) {
			return response.json();
		    } else {
			console.log("Error " + response.status);
		    }
		}).then(data => {
		    for (let j=0; j<ChainIDs.length; j++) {
			if (data[ChainIDs[j]]) {
			    let td = document.getElementById(`zetaclients-lastscanned-${i}-${ChainIDs[j]}`);
			    td.innerText = data[ChainIDs[j]];
			}
		    }
		}).catch(err => {
		    console.log(err);
		});
	}


    } catch (error) {
	console.log("Error " + error);
    }
}

zetaclients_versions();

// from zeta1xxxx => moniker in the validators list
async function getMonikerFromAccountAddress(address) {
    // turn zeta1xxx into zetavaloper1xxx
    const d = decode(address, "bech32");
    if (!d) {
	return null;
    }
    const a = convertbits(d.data, 5, 8, false);
    const valAddress = encode("zetavaloper", convertbits(a, 8, 5, true), "bech32");
    console.log(valAddress);
    
    const resource = `cosmos/staking/v1beta1/validators/${valAddress}`;
    const url = `${nodeURL}/${resource}`;
    let p = await fetch(url, {method: 'GET'});
    if (!p.ok) {
	console.log("Error " + p.status);
	return null;
	}
    let data = await p.json();
    console.log(data);
    return data.validator.description.moniker;
}

getMonikerFromAccountAddress("zeta1ggqzjf5726uu7xc6pfwg00lny79w6t3a3utpw5");


// render a table showing gas price updates from zetaclients
async function gasPriceHeartBeats() {
    function appendMessage(msg) {
	let textarea = document.getElementById('console-gas-price-heart-beats');
	textarea.value += msg + "\n";
    }

    const chainIds = [5, 97, 80001, 18332];
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
        const latestBlock = await getLatestBlockNumber(chainId);
        console.log(`chainid ${chainId} latest block ${latestBlock}; `);
	appendMessage(`chainid ${chainId} latest block ${latestBlock}; analyzing reports from zetaclients...`);

	const blockNums = [];
	const badClientIndexes = [];
	for (let i = 0; i < data.GasPrice.block_nums.length; i++) {
	    const blockNum = parseInt(data.GasPrice.block_nums[i], 10);
	    blockNums.push(blockNum);
	    const blockDiff = latestBlock - blockNum;
	    if (blockDiff > 100) {
		badClientIndexes.push(i);
	    }
	}
	console.log(blockNums);
	if (badClientIndexes.length == 0) {
	    appendMessage(`  OK: chainid ${chainId} no bad clients; `);
	} else {
	    appendMessage(`  WARNING: chainid ${chainId} has bad clients; `);
	    for (let i = 0; i < badClientIndexes.length; i++) {
		const index = badClientIndexes[i];
		const blockNum = parseInt(data.GasPrice.block_nums[index], 10);
		const blockDiff = latestBlock - blockNum;
		appendMessage(`    client ${data.GasPrice.signers[index]} is ${blockDiff} blocks behind; `);
		appendMessage(`    likely to be validator with moniker "${await getMonikerFromAccountAddress(data.GasPrice.signers[index])}"`);
	    }
	}
	appendMessage(`  maximum latency is ${latestBlock-Math.min(...blockNums)}`);
	appendMessage(`  minimum latency is ${latestBlock-Math.max(...blockNums)}`);

    }
}

gasPriceHeartBeats();

async function getLatestBlockNumber(chainId) {
    const bodyForBlockNumber = {
	"jsonrpc": "2.0",
	"method": "eth_blockNumber",
	"params": [],
	"id": 1
    };
    if (chainId != 18332) {
    	let evmRPC = RPCByChainID[chainId];
	let p2 = await fetch(evmRPC, {
	    method: 'POST',
	    body: JSON.stringify(bodyForBlockNumber),
	    headers: { 'Content-Type': 'application/json' }
	});
	if (!p2.ok) {
	    console.log("Error " + p2.status);
	    return null;
	}
	let data2 = await p2.json();
	const latestBlock = parseInt(data2.result, 16);
	return latestBlock;
    } else if (chainId == 18332) {
	const btcRPC = RPCByChainID[chainId];
	const url = `${btcRPC}/blocks/tip/height`; // esplora API from blockstream: doc: https://github.com/Blockstream/esplora/blob/master/API.md
	let p2 = await fetch(url, {	    method: 'GET'    });
	if (!p2.ok) {
	    console.log("Error " + p2.status);
	    return null;
	}
	let data2 = await p2.text();
	console.log(data2);
	const latestBlock = parseInt(data2, 10);
	return latestBlock;
    }
    return null; 
}

getLatestBlockNumber(18332);


async function updateTSS() {
    const resource = "zeta-chain/crosschain/get_tss_address";
    var p3 = await fetch(`${nodeURL}/${resource}`, {
        method: 'GET',
    });
    let data3 = await p3.json();
    console.log(data3);
    if (data3?.btc == null) {
	console.log("Error: no tss address for btc", data3);
	return;
    }
    const btcAddress = data3.btc;
    updateUTXO(btcAddress);
    updateAddressInfo(btcAddress);
    updateTxs(btcAddress);
}

updateTSS();


async function updateUTXO(addr) {
    const balance = document.getElementById("utxo-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${addr}/utxo`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`UTXOs (${data.length})`, JSON.stringify(data, null, 2)));
    utxos = data;
    // makeTransaction(p2wpkhAddress, 10000, data, "hello world");
}

async function updateAddressInfo(addr) {
    const balance = document.getElementById("address-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${addr}`);
    const data = await p1.json();
    const bal = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    balance.replaceChildren(addDetails(`Address Info: ${data.address};  balance ${bal} sats (${bal/100000000} BTC)`,
				       JSON.stringify(data, null, 2)));
}

async function updateTxs(addr) {
    const balance = document.getElementById("txs-info");
    const p1 = await fetch(`${esploraAPIURL}/address/${addr}/txs`);
    const data = await p1.json();
    balance.replaceChildren(addDetails(`Transactions (${data.length})`, JSON.stringify(data, null, 2)));
    txs = data;
}
