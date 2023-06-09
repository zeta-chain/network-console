(async () => {
    var connectorABI, zetaTokenABI, erc20CustodyABI;
    var RPCByChainID = {
	5: "https://rpc.ankr.com/eth_goerli",
	97: "https://data-seed-prebsc-1-s1.binance.org:8545",
	80001: "https://rpc-mumbai.maticvigil.com",
    };

    async function  readABIs() {
	try {
	    let connectorABIFile = await fetch('abi/ZetaConnectorEth.json');
	    let connectorABIJson = await connectorABIFile.json();
	    connectorABI = connectorABIJson.abi;
	    console.log("connectorABI", connectorABI);
	    let zetaTokenABIFile = await fetch('abi/ZetaNonEth.json');
	    let zetaTokenABIJson = await zetaTokenABIFile.json();
	    zetaTokenABI = zetaTokenABIJson.abi;
	    console.log("zetaTokenABI", zetaTokenABI);
	    let erc20CustodyABIFile = await fetch('abi/ERC20Custody.json');
	    let erc20CustodyABIJson = await erc20CustodyABIFile.json();
	    erc20CustodyABI = erc20CustodyABIJson.abi;
	    console.log("erc20CustodyABI", erc20CustodyABI);
	} catch (error) {
	    console.log('error', error);
	}
    }
    await readABIs();

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
	});
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


    async function externalContractAddress() {
	try {
	    let resource = "zeta-chain/zetacore/observer/get_core_params";
	    let p1 = await fetch(`${nodeURL}/${resource}`, {method: 'GET'});
	    let data = await p1.json();
	    console.log(data);
	    let pre = document.getElementById("external-contract-addresses");
	    pre.textContent = JSON.stringify(data.core_params, null, 2);
	    let div = document.getElementById("external-contract-addresses-summary");
	    div.appendChild(makeTableElement2(data.core_params.core_params, ["chain_id", "zeta_token_contract_address", "connector_contract_address", "erc20_custody_contract_address"]));
	} catch (error) {
	    console.log('error', error);
	}
    }
    externalContractAddress();


    async function validateContracts(chain_id) {
	try {
	    appendMessage(`validating the three contracts on chain_id = ${chain_id}`);
	    let resource = `zeta-chain/zetacore/observer/get_client_params_for_chain/${chain_id}`;
	    let p1 = await fetch(`${nodeURL}/${resource}`, {method: 'GET'});
	    let data = await p1.json();
	    console.log(data);
	    let connectorAddr = data.core_params.connector_contract_address;
	    let zetaTokenAddr = data.core_params.zeta_token_contract_address;
	    let erc20CustodyAddr = data.core_params.erc20_custody_contract_address;
	    console.log("connectorAddr", connectorAddr);
	    console.log("zetaTokenAddr", zetaTokenAddr);
	    console.log("erc20CustodyAddr", erc20CustodyAddr);

	    resource = `zeta-chain/zetacore/crosschain/get_tss_address`;
	    let p2 = await fetch(`${nodeURL}/${resource}`, {method: 'GET'});
	    let data2 = await p2.json();
	    let tssAddr = data2.eth;
	    console.log("tssAddr", tssAddr);
	    // appendMessage(`tssAddr = ${tssAddr}`);

	    let web3 = new Web3(RPCByChainID[chain_id]);
	    let connectorContract = new web3.eth.Contract(connectorABI, connectorAddr);
	    console.log("connectorContract", connectorContract);
	    let res = await connectorContract.methods.tssAddress().call();
	    console.log("connectorContract.tssAddress()", res);
	    // appendMessage(`connectorContract.tssAddress() = ${res}`);
	    if (res == tssAddr) {
		appendMessage(`OK: Connector: TSS address match;`);
	    } else {
		appendMessage(`ERROR: Connector: TSS address mismatch;`);
	    }

	    let res2 = await connectorContract.methods.zetaToken().call();
	    // appendMessage(`connectorContract.zetaToken() = ${res2}`);
	    // appendMessage(`zetaTokenAddr = ${zetaTokenAddr}`);
	    if (res2.toLowerCase() == zetaTokenAddr.toLowerCase()) {
		appendMessage(`OK: Connector: zetaToken address match;`);
	    } else {
		appendMessage(`ERROR: Connector: zetaToken address mismatch;`);
	    }

	    try {
		let erc20CustodyContract = new web3.eth.Contract(erc20CustodyABI, erc20CustodyAddr);
		let res3 = await erc20CustodyContract.methods.TSSAddress().call();
		// appendMessage(`erc20CustodyContract.TSSAddress() = ${res3}`);
		// appendMessage(`tssAddr = ${tssAddr}`);
		if (res3.toLowerCase() == tssAddr.toLowerCase()) {
		    appendMessage(`OK: ERC20Custody:TSS address match;`);
		} else {
		    appendMessage(`ERROR: ERC20Custody: TSS address mismatch;`);
		}
	    } catch (error) {
		console.log('error', error);
	    }

	    try {
		let zetaTokenContract = new web3.eth.Contract(zetaTokenABI, zetaTokenAddr);
		let res3 = await zetaTokenContract.methods.connectorAddress().call();
		// appendMessage(`zetaTokenContract.connectorAddress() = ${res3}`);
		// appendMessage(`connectorAddr = ${connectorAddr}`);
		if (res3.toLowerCase() == connectorAddr.toLowerCase()) {
		    appendMessage(`OK: ZetaToken: connector address match;`);
		} else {
		    appendMessage(`ERROR: ZetaToken: connector address mismatch;`);
		}

		let res4 = await zetaTokenContract.methods.tssAddress().call();
		// appendMessage(`zetaTokenContract.tssAddress() = ${res4}`);
		// appendMessage(`tssAddr = ${tssAddr}`);
		if (res4.toLowerCase() == tssAddr.toLowerCase()) {
		    appendMessage(`OK: ZetaToken: TSS address match;`);
		} else {
		    appendMessage(`ERROR: ZetaToken: TSS address mismatch;`);
		}
	    } catch (error) {
		console.log('error', error);
	    }
	    appendMessage(``);
	    
	} catch (error) {
	    console.log('error', error);
	}
    }

   
    async function validate() {
	await validateContracts(5);
	await validateContracts(97);
	await validateContracts(80001);
    }
    validate();


    function appendMessage(message) {
	var textbox = document.getElementById("console");
	textbox.value += message + "\n";
    }
    
    
})();
