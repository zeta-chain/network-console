import {nodeURL,evmURL,RPCByChainID, esploraAPIURL} from './common.js';
import './web3.min.js';

class AuditPage {
    constructor(){}

    async initialize() {
        await this.getTssAddress();
        await this.getZRC20Addresses();
        await this.getABIs();
        this.getWeb3();
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

        if (fcoin.coin_type == "Gas") {
            if (chainID != 18332) {
                const foreignWeb3 = this.web3ByChainId[chainID];
                assets = await foreignWeb3.eth.getBalance(this.tss.eth);
                assets = assets / Math.pow(10, decimals); 
            } else { // bitcoin clients
                const resource = `${esploraAPIURL}/address/${this.tss.btc}`;
                const p = await fetch(resource, {
                    method: 'GET',
                });
                const data = await p.json();
                assets = data.chain_stats.funded_txo_sum / Math.pow(10, decimals);
            }
        }
        const zrc20 = new this.web3zevm.eth.Contract(this.ZRC20ABI, fcoin.zrc20_contract_address);
        liabilities = await zrc20.methods.totalSupply().call();
        liabilities = liabilities / Math.pow(10, decimals);

        if (chainID == 18332) {
            const fungibleModuleAddress = "0x735b14BB79463307AAcBED86DAf3322B1e6226aB";
            const fungibleBalance = await zrc20.methods.balanceOf(fungibleModuleAddress).call();
            console.log("fungible balance", fungibleBalance);
        }

        const flag = (assets >= liabilities) ? "🟢" : "🔴";
        return DIV(
            H3(`${flag}: Reserve of ${symbol} ZRC20 address ${fcoin.zrc20_contract_address} on chain ${chainID}`),
            P(`Chain ID: ${chainID}, Symbol: ${symbol}, Decimals: ${decimals}`),
            P(`Liabilities (ZRC20 Supply): ${liabilities}`),
            P(`Assets (ZRC20 Balance): ${assets}`),
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

    }
}


const page = new AuditPage();
await page.initialize();

console.log(page.tss);
console.log(page.zrc20s);
console.log("sys abi", page.SystemContractABI);
console.log("web3zevm", page.web3zevm);
await page.render();
