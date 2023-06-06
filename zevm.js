(async () => {

    var web3 = new Web3(`${evmURL}`);
    console.log(web3);


    var SystemContractABI; 
    async function read_abis() {
	try {
	    let p1 = await fetch('abi/SystemContract.json');
	    let data1 = await p1.json();
	    SystemContractABI = data1.abi;
	    console.log("set SystemContractABI", SystemContractABI);
	} catch (err) {
	    console.log(err);
	}
    }
    read_abis();


    // foreign coins
    async function foreign_coins(){
	fetch(`${nodeURL}/zeta-chain/zetacore/fungible/foreign_coins`, {
            method: 'GET',
	}).then(response => {
            if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
	}).then(data => {
	    // let resource = "zeta-chain/zetacore/crosschain/get_tss_address";
	    // let p1 = await fetch(`${nodeURL}/${resource}`, { method: 'GET'	});
	    // let data2 = await p1.json();
	    // data2.eth
            let div = document.getElementById('foreign-coins');
            div.textContent = JSON.stringify(data, null, 2);

            let div2 = document.getElementById('foreign-coins-summary');
	    div2.appendChild(makeTableElement2(data.foreignCoins, ["zrc20_contract_address", "foreign_chain_id", "symbol", "coin_type"]));

	    data.foreignCoins.forEach( (coin) => {
		
	    })
            
	}).catch(error => {
	    console.log("fetch error" + error);
	})
    }
    foreign_coins();

    var SystemContractAddress; 
    // system contract
    async function system_contract() {
	let p1 = await fetch(`${nodeURL}/zeta-chain/zetacore/fungible/system_contract`, {
            method: 'GET',
	})
	let data = await p1.json();
	let div = document.getElementById('system-contract');
	div.textContent = JSON.stringify(data, null, 2);

	let div2 = document.getElementById('system-contract-summary');
	div2.appendChild(makeTableElement(data.SystemContract));
	SystemContractAddress = data.SystemContract.system_contract;
	console.log("system contract--set", SystemContractAddress);
    }
    await system_contract();


    var FungibleModuleAddress;

    var sys;
    console.log("system contract--read", SystemContractAddress);
    sys = new web3.eth.Contract(SystemContractABI, SystemContractAddress);
    async function system_contract_status() {
	let summary = {};
	let p1 = await sys.methods.FUNGIBLE_MODULE_ADDRESS().call();
	summary.fungible_module_address = p1;
	let div = document.getElementById('system-contract-status');

	let p2 = await sys.methods.uniswapv2FactoryAddress().call();
	summary.uniswapv2_factory_address = p2;
	let p3 = await sys.methods.uniswapv2Router02Address().call();
	summary.uniswapv2_router02_address = p3;
	let p4 = await sys.methods.wZetaContractAddress().call();
	summary.wzeta_contract_address = p4;
	let p5 = await sys.methods.zetaConnectorZEVMAddress().call();
	summary.zeta_connector_zevm_address = p5;
	
	
	div.appendChild(makeTableElement(summary));
    }
    system_contract_status();

    var chainIDs = [5, 97, 80001];
    async function gas_price() {
	let summary = {};
	for (let i = 0; i<chainIDs.length; i++) {
	    let p1 = await sys.methods.gasPriceByChainId(chainIDs[i]).call();
	    console.log("gas price", p1);
	    summary[chainIDs[i]] = p1;
	}
	let div = document.getElementById('gas-prices');
	div.appendChild(makeTableElement(summary));
    }
    gas_price();

    async function gas_zeta_pool_address() {
	let summary = {};
	for (let i = 0; i<chainIDs.length; i++) {
	    let p1 = await sys.methods.gasZetaPoolByChainId(chainIDs[i]).call();
	    console.log("gas zeta pool address", p1);
	    summary[chainIDs[i]] = p1;
	}
	let div = document.getElementById('gas-zeta-pool');
	div.appendChild(makeTableElement(summary));
    }
    gas_zeta_pool_address();

})();
