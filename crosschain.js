// supported chains
{
    fetch(`${nodeURL}/zeta-chain/observer/supportedChains`, {
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

async function pendingOutboundQueue() {
    try {
	let resource = "zeta-chain/crosschain/TSS";
	let p1 = await fetch(`${nodeURL}/${resource}`, {
	    method: 'GET',
	});
	let data = await p1.json();
	let TSS = data.TSS.tss_pubkey;
	console.log("TSS", TSS);

	resource = "zeta-chain/crosschain/pendingNonces";
	let p2 = await fetch(`${nodeURL}/${resource}`, { method: 'GET', });
	let data2 = await p2.json();
	let pending = data2.pending_nonces;
	pending = pending.filter( (x) => x.tss == TSS);
	console.log("PENDING", pending);

	let pre = document.getElementById("pending-outbound-queues");
	pre.textContent = JSON.stringify(data2, null, 2);

	let div = document.getElementById("pending-outbound-queues-summary");
	div.appendChild(makeTableElement2(pending, ["chain_id", "nonce_low", "nonce_high"]));
	
    } catch (error) {
	console.log('error', error);
    }
}
pendingOutboundQueue();
