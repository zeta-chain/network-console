import {nodeURL,evmURL,RPCByChainID, esploraAPIURL,AddressExplorerByChainID} from './common.js';
import './web3.min.js';

class AuditPage {
    constructor(){}

    async initialize() {
	await this.getABIs();
        await this.getTssAddress();
        await this.getZRC20Addresses();
	this.getWeb3();
	await this.getSystemContracts();
	await this.getSystemPools();
    }

    async getSystemContracts() {
	const resource = `${nodeURL}/zeta-chain/zetacore/fungible/system_contract`;
	const p = await fetch(resource, {
	    method: 'GET',
	});
	this.systemContractsAddresses = (await p.json()).SystemContract;
	console.log("system contract address", this.systemContractsAddresses);
	this.systemContract = new this.web3zevm.eth.Contract(this.SystemContractABI, this.systemContractsAddresses.system_contract);

	let p2 = await this.systemContract.methods.uniswapv2FactoryAddress().call();
	this.uniswapv2FactoryAddress = p2;
	this.uniswapv2Factory = new this.web3zevm.eth.Contract(this.UniswapV2PairABI, this.uniswapv2FactoryAddress);
    }
    
    async getTssAddress() {
        if (this.tss) return; 
        const resource = "zeta-chain/zetacore/crosschain/get_tss_address";
        const p = await fetch(`${nodeURL}/${resource}`, {
            method: 'GET',
        });
        this.tss = await p.json(); 
    }

    async getZRC20Addresses() {
        const resource = "zeta-chain/zetacore/fungible/foreign_coins";
        const p = await fetch(`${nodeURL}/${resource}`, {
            method: 'GET',
        });
        this.zrc20s = (await p.json()).foreignCoins;
    }

    async getSystemPools() {
	console.log("system contract", this.systemContract.methods);
	const chainIDs = [5, 97, 80001, 18332];

	this.systemPoolAddresses = {};
	for (let i = 0; i < chainIDs.length; i++) {
	    const chainID = chainIDs[i];
	    const poolAddress = await this.systemContract.methods.gasZetaPoolByChainId(chainID).call();
	    this.systemPoolAddresses[chainID] = poolAddress;
	}
		
    }

    async getABIs() {
	let p1 = await fetch('abi/SystemContract.json');
	let data1 = await p1.json();
	this.SystemContractABI = data1.abi;

	let p2 = await fetch('abi/UniswapV2Pair.json');
	let data2 = await p2.json();
	this.UniswapV2PairABI = data2.abi;

	let p3 = await fetch('abi/ZRC20.json');
	let data3 = await p3.json();
	this.ZRC20ABI = data3.abi;

	let p4 = await fetch('abi/UniswapV2Factory.json');
	let data4 = await p4.json();
	this.UniswapV2FactoryABI = data4.abi;
	console.assert(this.SystemContractABI.length > 0);
    }

    getWeb3() {
        this.web3zevm = new Web3(evmURL);
        this.web3ByChainId = {};
        for (const i in this.zrc20s) {
            const fcoin = this.zrc20s[i];
            const chainID = fcoin.foreign_chain_id;
            if (chainID != 18332 && chainID != 8332) {
                if (!this.web3ByChainId[chainID]) {
                    this.web3ByChainId[chainID] = new Web3(`${RPCByChainID[chainID]}`);
                }
            }
        }
    }

    async TSSReserveComponent(fcoin) {
        const chainID = fcoin.foreign_chain_id;
        const symbol = fcoin.symbol;
        const decimals = fcoin.decimals;
        let assets, liabilities;
	let tssAddr; 

        if (fcoin.coin_type == "Gas") {
            if (chainID != 18332) {
                const foreignWeb3 = this.web3ByChainId[chainID];
		tssAddr = this.tss.eth;
                assets = await foreignWeb3.eth.getBalance(this.tss.eth);
                assets = assets / Math.pow(10, decimals); 
            } else { // bitcoin clients
		tssAddr = this.tss.btc;
                const resource = `${esploraAPIURL}/address/${this.tss.btc}`;
                const p = await fetch(resource, {
                    method: 'GET',
                });
                const data = await p.json();
		console.log("btc address info", data);
                assets = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / Math.pow(10, 8);
            }
        }
        const zrc20 = new this.web3zevm.eth.Contract(this.ZRC20ABI, fcoin.zrc20_contract_address);
        liabilities = await zrc20.methods.totalSupply().call();
        liabilities = liabilities / Math.pow(10, decimals);

        const fungibleModuleAddress = "0x735b14BB79463307AAcBED86DAf3322B1e6226aB";
        let fungibleBalance = await zrc20.methods.balanceOf(fungibleModuleAddress).call();
	fungibleBalance = fungibleBalance / Math.pow(10, decimals);

	let poolBalance;
	if (fcoin.coin_type == "Gas") {
	    const poolAddress = this.systemPoolAddresses[chainID];
	    poolBalance = await zrc20.methods.balanceOf(poolAddress).call();
	    poolBalance = poolBalance / Math.pow(10, decimals);
	}

	console.log("address explorer", AddressExplorerByChainID[chainID]);

        const flag = (assets >= liabilities) ? "🟢" : "🔴";
	const surplus = assets - liabilities;
        return DIV(
            H3(`${flag}: Reserve of ${symbol} ZRC20 address ${fcoin.zrc20_contract_address} on chain ${chainID}`),
            PRE(TEXT(`Chain ID: ${chainID}, Symbol: ${symbol}, Decimals: ${decimals}`)),
            PRE(
		TEXT(`Liabilities (ZRC20 Supply):            ${liabilities}`), BR(),
		TEXT(`  Fungile Module Balance:              ${fungibleBalance}`), BR(),
		TEXT(`  System UniswapV2 Pool asset-wZETA:   ${poolBalance}`), BR(),
		TEXT(`  Rest:                                ${liabilities - fungibleBalance - poolBalance}`), BR(),
	    ),
	    PRE(
		A(`Assets (External Chain Balance):       ${assets}`)
		    .att$("href", `${AddressExplorerByChainID[chainID]}/${tssAddr}`)
		    .att$("target", "_blank"), BR(),
	    ),
	    PRE(
		TEXT(`Surplus:                               ${surplus}`), BR(),
	    ),
        );
    }

    async render() {
        
        const entry = document.getElementById("entry");
        entry.appendChild(H1("Foreign Reserves"));
        for (const i in this.zrc20s) {
            const fcoin = this.zrc20s[i];
            console.log("foreign coin", fcoin);
            entry.appendChild(await this.TSSReserveComponent(fcoin));
        }
	entry.appendChild(H1("ZETA Supply"));

    }
}


const page = new AuditPage();
await page.initialize();

console.log(page.tss);
console.log(page.zrc20s);
console.log("web3zevm", page.web3zevm);
await page.render();
