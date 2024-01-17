import {evmURL, nodeURL, makeTableElementNew, externalChainIDs, getForegienCoins, Chains, network} from './common.js';

// console.log("Web3", Web3);
let ZRC20ABI;
let UNISWAPV2FACTORYABI;
let UNISWAPV2ROUTER02ABI;
let UNISWAPV2PAIRABI;

async function read_abis() {
	try {
		let p3 = await fetch('abi/ZRC20.json');
		let data3 = await p3.json();
		ZRC20ABI = data3.abi;
		console.log("set ZRC20ABI", ZRC20ABI);
	} catch (err) {
		console.log(err);
	}
	try {
		let p3 = await fetch('abi/UniswapV2Factory.json');
		let data3 = await p3.json();
		UNISWAPV2FACTORYABI = data3.abi;
		console.log("set UNISWAPV2FACTORYABI", UNISWAPV2FACTORYABI);
	} catch (err) {
		console.log(err);
	}
	try {
		let p3 = await fetch('abi/UniswapV2Router02.json');
		let data3 = await p3.json();
		UNISWAPV2ROUTER02ABI = data3.abi;
		console.log("set UNISWAPV2ROUTER02ABI", UNISWAPV2ROUTER02ABI);
	} catch (err) {
		console.log(err);
	}
	try {
		let p3 = await fetch('abi/UniswapV2Pair.json');
		let data3 = await p3.json();
		UNISWAPV2PAIRABI = data3.abi;
		console.log("set UNISWAPV2PAIRABI", UNISWAPV2PAIRABI);
	} catch (err) {
		console.log(err);
	}
}

read_abis();

window.onload = (async () => {
    console.log("div func", DIV); 
    var web3 = new Web3(`${evmURL}`);
    console.log(web3);
    let fromWei = web3.utils.fromWei;
    var wzetaAddress; 

    var SystemContractABI;
    var UniswapV2PairABI;
    var ZRC20ABI; 
    async function read_abis() {
	    try {
	        let p1 = await fetch('abi/SystemContract.json');
	        let data1 = await p1.json();
	        SystemContractABI = data1.abi;
	        console.log("set SystemContractABI", SystemContractABI);

	        let p2 = await fetch('abi/UniswapV2Pair.json');
	        let data2 = await p2.json();
	        UniswapV2PairABI = data2.abi;
	        console.log("set UniswapV2PairABI", UniswapV2PairABI);

	        let p3 = await fetch('abi/ZRC20.json');
	        let data3 = await p3.json();
	        ZRC20ABI = data3.abi;
	        console.log("set ZRC20ABI", ZRC20ABI);
	    } catch (err) {
	        console.log(err);
	    }
    }
    await read_abis();


    // foreign coins
    var zrc20s = {}; // key: contract address, value: coin info (from foreign_coins RPC)
    async function foreign_coins(){

		const url = `${nodeURL}/zeta-chain/fungible/foreign_coins`;
	    fetch(url , {
            method: 'GET',
	    }).then(response => {
            if (!response.ok) {
		        throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
	    }).then(data => {
            let div = document.getElementById('foreign-coins');
            div.textContent = JSON.stringify(data, null, 2);
            let div2 = document.getElementById('foreign-coins-summary');
	        div2.appendChild(makeTableElement2(data.foreignCoins, ["zrc20_contract_address", "foreign_chain_id", "symbol", "coin_type", "asset"]));
	        
	        data.foreignCoins.forEach( (coin) => {
		        zrc20s[coin.zrc20_contract_address] = coin;
	        });
            
	    }).catch(error => {
	        console.log("fetch error" + error);
	    });
    }
    let coin_promise = foreign_coins();


    var SystemContractAddress; 
    // system contract
    async function system_contract() {
		const resource = `${nodeURL}/zeta-chain/fungible/system_contract`;
	    let p1 = await fetch(resource, {
            method: 'GET',
	    });
	    let data = await p1.json();
        let d = document.getElementById('system-contract-summary');
	    d.appendChild(makeTableElement(data.SystemContract));
        d.appendChild(
            DETAILS(
                SUMMARY(CODE(TEXT(`JSON`))),
                DIV(
                    A(TEXT("hey")).att$("href", `${resource}`),
                    PRE(TEXT(JSON.stringify(data, null, 2)))
                )));
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
	    wzetaAddress = p4;
	    let p5 = await sys.methods.zetaConnectorZEVMAddress().call();
	    summary.zeta_connector_zevm_address = p5;
	    
	    div.appendChild(makeTableElement(summary));
    }
    let sys_promise = system_contract_status();

    
    var chainIDs = externalChainIDs;
    async function gas_price() {
	    let summary = {};
	    for (let i = 0; i<chainIDs.length; i++) {
	        let p1 = await sys.methods.gasPriceByChainId(chainIDs[i]).call();
	        console.log("gas price", p1);
	        summary[chainIDs[i]] = p1;
	    }
	    let div = document.getElementById('gas-prices');
	    div.appendChild(makeTableElementNew(summary));
    }
    gas_price();


	async function gas_zeta_pool_address() {
		let summary = {};

		let pools = [];
		async function fillPoolInfo(chainID, pair, decimals) {
			// query the pairs
			let pool = {};
			pool.chain_id = chainID;
			pool.pair_address = pair;
			let pairContract = new web3.eth.Contract(UniswapV2PairABI, pair);
			let p2 = await pairContract.methods.getReserves().call();
			console.log("gas zeta pool reserves", p2);
			// reserves[i] = p2;
			let reserve0 = Number(fromWei(p2[0]));
			let reserve1 = Number(fromWei(p2[1]));

			let p3 = await pairContract.methods.token0().call();
			let factor = 1e18 / Math.pow(10, decimals);
			if (p3 == wzetaAddress) reserve1 *= factor;
			else reserve0 *= factor;

			console.log("gas zeta pool token0", p3);
			pool.reserve0 = `${reserve0.toFixed(3)} ${zrc20AddressToSymbol(p3)}`;
			let p4 = await pairContract.methods.token1().call();
			pool.reserve1 = `${reserve1.toFixed(3)} ${zrc20AddressToSymbol(p4)}`;
			console.log("gas zeta pool token1", p4);
			if (p3 == wzetaAddress) {
				pool.gas_asset = pool.reserve1;
				pool.wzeta = pool.reserve0;
				pool.ratio = (reserve0 / reserve1).toFixed(3);
			} else {
				pool.gas_asset = pool.reserve0;
				pool.wzeta = pool.reserve1;
				pool.ratio = (reserve1 / reserve0).toFixed(3);
			}
			return pool;
		}

		function zrc20AddressToSymbol(addr) {
			if (addr == wzetaAddress) {
				return "wZETA";
			}
			let coin = zrc20s[addr];
			if (coin) {
				return coin.symbol;
			}
			return addr;
		};
		let i = 0;
		// gas/zeta pools
		// for (; i < chainIDs.length; i++) {
		// 	let p1 = await sys.methods.gasZetaPoolByChainId(chainIDs[i]).call();
		// 	console.log("gas zeta pool address", p1);
		// 	pools[i] = await fillPoolInfo(chainIDs[i], p1, );
		// }
		// non-gas/zeta pools
		async function getPair(tokenA, tokenB) {
			const UNISWAPV2FACTORY = "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c";
			const factory = new web3.eth.Contract(UNISWAPV2FACTORYABI, UNISWAPV2FACTORY);
			return factory.methods.getPair(tokenA, tokenB).call();
		}
		let coins = await getForegienCoins()
		console.log("coins", coins);
		for (let coin of coins) {
			console.log("## coin", coin.coin_type);
			// if (coin.coin_type != "Gas") {
			let pair = await getPair(coin.zrc20_contract_address, wzetaAddress)
			console.log("pair", pair);
			pools[i] = await fillPoolInfo(chainIDs[i], pair, coin.decimals);
			i++;
			// }
		}


		console.log("reserves", pools);
		let div = document.getElementById('gas-zeta-pool');
		div.appendChild(makeTableElement2(pools, ["pair_address", "gas_asset", "wzeta", "ratio"]));


	}
    await Promise.all([coin_promise, sys_promise]);
    gas_zeta_pool_address();


    // ==========================
    // my wallet section =======
    // ==========================
    let myWalletAddress;
    const inputWallet = document.getElementById("my-wallet-address")
    if (localStorage.getItem("eth-wallet-address")) {
	    myWalletAddress = localStorage.getItem("eth-wallet-address");
	    inputWallet.value = myWalletAddress;
    }

    document.getElementById('button-set-wallet-address').addEventListener('click', async () => {
	    myWalletAddress = inputWallet.value;
	    localStorage.setItem("eth-wallet-address", myWalletAddress);
	    await updateMyZRC20Balances();
    });

    async function updateMyZRC20Balances() {
	    // console.log("zrc20s", zrc20s);
	    balances = {}; 
	    for (const zrc20Addr in zrc20s) {
	        let coin = zrc20s[zrc20Addr];
	        console.log("coin", coin);
	        const decimals = coin.decimals;
	        let contract = new web3.eth.Contract(ZRC20ABI, coin.zrc20_contract_address);
	        let balance = await contract.methods.balanceOf(myWalletAddress).call();
	        console.log("balance", balance);
	        balances[zrc20Addr] = `${fromDecimals(balance, decimals).toFixed(4)} ${coin.symbol}`;
	    }

	    let div = document.getElementById('my-zrc20-balances');
	    div.appendChild(makeTableElement(balances));
    }

    


}); 
