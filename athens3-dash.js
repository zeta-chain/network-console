var nodeURL = 'http://3.218.170.198:1317';
var corsProxyURL = 'http://3.132.197.22:8088';

// Node info
async function node_info(){
    try {
	var resource = "cosmos/base/tendermint/v1beta1/node_info";
	var elemId = "node-info";
	var syncing = true; 
	var r1 = await fetch(`${corsProxyURL}/${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	resource = "cosmos/base/tendermint/v1beta1/syncing";
	var r2 = await fetch(`${corsProxyURL}/${nodeURL}/${resource}`, {
	    method: 'GET',
	});	  
	var data = await r1.json();
	// console.log(data);
	var data2 = await r2.json();
	
	
	const div1 = document.getElementById(elemId);
	div1.textContent = JSON.stringify(data, null, 2);
	let summary = {
	    cors_proxy_url: corsProxyURL,
	    node_url: nodeURL,
	    syncing: data2.syncing,
	    network: data.default_node_info.network,
	    moniker: data.default_node_info.moniker,
	    zetacored_version: data.application_version.version,
	}
	let div2 = document.getElementById(`${elemId}-summary`);
	// div2.textContent = JSON.stringify(makeTableElement(summary), null, 2);
	div2.appendChild(makeTableElement(summary));
    } catch (error) {
	console.log('error', error);
	throw error;
    }
}


// Keygen widget
{
    var resource = "zeta-chain/crosschain/keygen";
    fetch(`${corsProxyURL}/${nodeURL}/${resource}`, {
	method: 'GET',
    }).then(response => {
	if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
	}
	return response.json();
    }).then(data => {
	const div1 = document.getElementById('current-keygen');
	div1.textContent = JSON.stringify(data, null, 2);
	let kg = data.Keygen; 
	let summary = {status: kg.status, num_pubkeys: kg.granteePubkeys.length, block_num: kg.blockNumber}; 
	let div2 = document.getElementById("keygen-summary");
	// div2.textContent = JSON.stringify(summary, null, 2);
	div2.appendChild(makeTableElement(summary));
    }).catch(error => {
	console.log("fetch error" + error);
    })
}

// Network status widget
fetch('http://3.132.197.22:8088/http://3.218.170.198:26657/status', {
    method: 'GET',
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}).then(data => {
    let div = document.getElementById('block');
    div.innerHTML = JSON.stringify(data.result, null, 2);
    let div2 = document.getElementById('block-summary');
    let summary = {"block height": data.result.sync_info.latest_block_height,
		   "block timestamp": utcToLocal(data.result.sync_info.latest_block_time),
		   "earliest block timestamp": utcToLocal(data.result.sync_info.earliest_block_time)};
    div2.appendChild(makeTableElement(summary));
}).catch(error => {
    console.log("fetch error" + error);
})

// supply widget
fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/cosmos/bank/v1beta1/supply', {
    method: 'GET',
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}).then(data => {
    let div = document.getElementById('supply');
    div.textContent = JSON.stringify(data, null, 2);

    let amount = BigInt(data.supply[0].amount);
    let amountZeta = amount/BigInt(1e18); 
    let div2 = document.getElementById('supply-summary');
    let summary = {"supply": addCommas((amountZeta).toString()), "denom": "ZETA"};
    div2.appendChild(makeTableElement(summary));
}).catch(error => {
    console.log("fetch error" + error);
})

// validators
{
    var divElement = document.createElement("div");
    divElement.classList = "item";
    var widgets = document.getElementById("network-widgets");
    widgets.appendChild(divElement);
    var header = document.createElement("b");
    header.textContent = "Validators";
    divElement.appendChild(header);
    var summaryPre = document.createElement("div");
    divElement.appendChild(summaryPre);
    var button = document.createElement("button");
    button.textContent = "Raw JSON"; 
    button.onclick = function() {toggleDropdown("validators-dropdown")};
    divElement.appendChild(button);
    var detailPre = document.createElement("pre");
    detailPre.id = "validators-dropdown";
    divElement.appendChild(detailPre);
    detailPre.classList = "dropdown-content";
    fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/cosmos/staking/v1beta1/validators', {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        detailPre.textContent = JSON.stringify(data, null, 2); 
        let jailed = 0;
        let jailed_monikers = []; 
        for (let i=0; i<data.validators.length; i++) {
            let val = data.validators[i];
            if (val.jailed) {
                jailed++;
                jailed_monikers.push(val.description.moniker);
            }
        }
        var summary = {"num_validators": data.validators.length, "num_jailed": jailed, "jailed_monikers": jailed_monikers};
        // summaryPre.textContent = JSON.stringify(summary, null, 2);
	summaryPre.appendChild(makeTableElement(summary));
    }).catch(error => {
        console.log("fetch error" + error);
    })
}

// supported chains
{
    fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/zeta-chain/observer/supportedChains', {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('supported-chains');
        div.textContent = JSON.stringify(data, null, 2);
        let div2 = document.getElementById('supported-chains-summary');
	div2.appendChild(makeTableElement2(data.chains, ["chain_name", "chain_id"])); 
	
    }).catch(error => {
        console.log("fetch error" + error);
    })
}


// foreign coins
{
    fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/zeta-chain/zetacore/fungible/foreign_coins', {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('foreign-coins');
        div.textContent = JSON.stringify(data, null, 2);

        // let amount = BigInt(data.supply[0].amount);
        // let amountZeta = amount/BigInt(1e18); 
        let div2 = document.getElementById('foreign-coins-summary');
	div2.appendChild(makeTableElement2(data.foreignCoins, ["zrc20_contract_address", "foreign_chain_id", "symbol", "coin_type"]));
        // let summary = {"supply": addCommas((amountZeta).toString()), "denom": "ZETA"};
        // div2.textContent = JSON.stringify(summary, null, 2);
    }).catch(error => {
        console.log("fetch error" + error);
    })
}


// system contract
async function system_contract() {
    fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/zeta-chain/zetacore/fungible/system_contract', {
        method: 'GET',
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        let div = document.getElementById('system-contract');
        div.textContent = JSON.stringify(data, null, 2);

        let div2 = document.getElementById('system-contract-summary');
	div2.appendChild(makeTableElement(data.SystemContract));
        // let summary = {"supply": addCommas((amountZeta).toString()), "denom": "ZETA"};
        // div2.textContent = JSON.stringify(summary, null, 2);
    }).catch(error => {
        console.log("fetch error" + error);
    })
}


node_info();
system_contract();
