import {AddressExplorerByChainID, bitcoinChainID, esploraAPIURL, evmURL, nodeURL, RPCByChainID,externalChainIDs} from './common.js';
import './web3.min.js';

class AuditPage {
    constructor() {
    }

    async initialize() {
        await this.getABIs();
        await this.getTssAddress();
        await this.getZRC20Addresses();
        this.getWeb3();
        await this.getSystemContracts();
        await this.getSystemPools();
        await this.getERC20Custody();
    }

    async getSystemContracts() {
        const resource = `${nodeURL}/zeta-chain/fungible/system_contract`;
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

    async getERC20Custody() {
        this.erc20CustodyAddress = {};
        for (let i=0; i<externalChainIDs.length; i++) {

            const chainID = externalChainIDs[i];
            if (chainID == 8332) continue;
            const resource = `${nodeURL}/zeta-chain/observer/get_chain_params_for_chain/${chainID}`;
            const p = await fetch(resource, {
                method: 'GET',
            });
            const chainParams = await p.json();
            console.log("chainParams", chainParams);
            const erc20CustodyAddress = chainParams.chain_params.erc20_custody_contract_address;
            console.log("erc20CustodyAddress", erc20CustodyAddress);
            this.erc20CustodyAddress[`${chainID}`] = erc20CustodyAddress;
        }
    }

    async getTssAddress() {
        if (this.tss) return;
        const resource = "zeta-chain/observer/get_tss_address";
        const p = await fetch(`${nodeURL}/${resource}/${bitcoinChainID}`, {
            method: 'GET',
        });
        this.tss = await p.json();
        console.log("tss", this.tss)
    }

    async getZRC20Addresses() {
        const resource = "zeta-chain/fungible/foreign_coins";
        const p = await fetch(`${nodeURL}/${resource}`, {
            method: 'GET',
        });
        this.zrc20s = (await p.json()).foreignCoins;
        console.log("zrc20s", this.zrc20s);
    }

    async getSystemPools() {
        console.log("system contract", this.systemContract.methods);
        const chainIDs = externalChainIDs;

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

        let p5 = await fetch('abi/ZetaConnectorEth.json');
        let data5 = await p5.json();
        this.EthConnectorABI = data5.abi;
        console.assert(this.EthConnectorABI.length > 0);

        let p6 = await fetch('abi/ZetaNonEth.json');
        let data6 = await p6.json();
        this.ZetaNonEthABI = data6.abi;
        console.assert(this.ZetaNonEthABI.length > 0);
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
            if (chainID != 18332 && chainID != 8332) {
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
        } else if (fcoin.coin_type == "ERC20") {
            const foreignWeb3 = this.web3ByChainId[chainID];
            const erc20CustodyAddress = this.erc20CustodyAddress[fcoin.foreign_chain_id];
            console.log("erc20CustodyAddress", erc20CustodyAddress);
            console.log("fcoin.asset fcoin.chainid", fcoin.asset, fcoin.foreign_chain_id);
            const erc20 = new foreignWeb3.eth.Contract(this.ZRC20ABI, fcoin.asset);
            const r = await erc20.methods.balanceOf(erc20CustodyAddress).call();
            console.log("erc20 balance", r);
            assets = r / Math.pow(10, decimals);
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
        } else if (fcoin.coin_type == "ERC20") {

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

    async ZETASupplyComponent() {
        const p = await fetch(`${nodeURL}/cosmos/bank/v1beta1/supply/by_denom?denom=azeta`);
        const data = await p.json();
        const zetaSupplyZeta = parseInt(data.amount.amount) / Math.pow(10, 18);


        const p2 = await fetch(`${nodeURL}/zeta-chain/observer/get_chain_params`);
        const data2 = await p2.json();
        console.log("data2", data2);
        const chainIDs = externalChainIDs;
        const zetaContractByChainID = {};
        let zetaLocked;
        const zetaSupplies = {};
        for (let params of data2.chain_params.chain_params) {
            const chainID = params.chain_id;
            const zetaContract = params.zeta_token_contract_address;
            zetaContractByChainID[chainID] = zetaContract;
            const RPC = RPCByChainID[chainID];
            const web3 = new Web3(RPC);

            if (chainID == 5 || chainID == 1) {
                const ethConnectorAddress = params.connector_contract_address;
                console.log("ethConnectorAddress", ethConnectorAddress);
                const connector = new web3.eth.Contract(this.EthConnectorABI, ethConnectorAddress);
                zetaLocked = await connector.methods.getLockedAmount().call();
                zetaLocked = parseInt(zetaLocked) / Math.pow(10, 18);
                console.log("eth chain zeta locked", zetaLocked);
            } else if (chainID == 97 || chainID == 80001 || chainID == 56) {
                const zeta = new web3.eth.Contract(this.ZetaNonEthABI, zetaContract);
                let zetaSupply = await zeta.methods.totalSupply().call();
                zetaSupply = parseInt(zetaSupply) / Math.pow(10, 18);
                console.log("chainID", chainID, "zetaSupply", zetaSupply);
                zetaSupplies[chainID] = zetaSupply;
            }

        }
        console.log("zetaContractByChainID", zetaContractByChainID);
        return DIV(
            PRE(TEXT(`Assets (ZETA Supply): ${zetaLocked}`), BR(),
                TEXT(`  ZETA locked on Ethereum: ${zetaLocked}`)
            ),
            PRE(TEXT(`Liabilities: `), BR(),
                TEXT(`ZETA Supply on ZetaChain:${zetaSupplyZeta}`), BR(),
                TEXT(`ZETA locked on BSC:      ${zetaSupplies[56]}`), BR(),
                // TEXT(`ZETA locked on Polygon:  ${zetaSupplies[80001]}`), BR()
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
        entry.appendChild(await this.ZETASupplyComponent());


    }
}


const page = new AuditPage();
await page.initialize();

console.log(page.tss);
console.log(page.zrc20s);
console.log("web3zevm", page.web3zevm);
await page.render();
