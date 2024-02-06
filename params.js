import {
    externalChainIDs,
    addDetails,
    nodeURL,
    RPCByChainID,
    corsProxyURL,
    hashServerURL,
    renderHeader
} from './common.js';
// import {create} from "./secp256k1";

await renderHeader();

(async () => {
    async function renderChainParams() {
        const div = document.getElementById('chain-params-json');
        const url = `${nodeURL}/zeta-chain/observer/get_chain_params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderChainParams();

    async function renderSlashingParams() {
        const div = document.getElementById('slashing-params-json');
        const url = `${nodeURL}/cosmos/slashing/v1beta1/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderSlashingParams();

    async function renderStakingParams() {
        const div = document.getElementById('staking-params-json');
        const url = `${nodeURL}/cosmos/staking/v1beta1/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
        console.log(element);
    }
    renderStakingParams();

    async function renderEmissionParams() {
        const div = document.getElementById('emission-params-json');
        const url = `${nodeURL}/zeta-chain/emissions/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderEmissionParams();

    async function renderGovParams() {
        async function render(subspace){
            const div = document.getElementById(`gov-params-json-${subspace}`);
            const url = `${nodeURL}/cosmos/gov/v1/params/${subspace}`;
            const response = await fetch(url);
            const data = await response.json();
            const element = createTreeView(div, data);
        }
        await render("deposit");
        await render("voting");
        await render("tallying");
    }
    renderGovParams();

    async function renderObserverParams() {
        const div = document.getElementById('observer-params-json');
        const url = `${nodeURL}/zeta-chain/observer/params`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
        return data;
    }
    const obP = renderObserverParams();

    async function renderNodeAccounts() {
        const div = document.getElementById('node-accounts-json');
        const url = `${nodeURL}/zeta-chain/observer/nodeAccount`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
        return data;
        const grantees = data.NodeAccount.map((x)=>x.granteeAddress);
        div.appendChild(createTreeView(document.createElement("div"), grantees));
    }
    const nAccP = renderNodeAccounts();


    async function renderObserverSet() {
        const div = document.getElementById('observer-set-json');
        const url = `${nodeURL}/zeta-chain/observer/observer_set`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderObserverSet();

    async function renderCrosschainFlags() {
        const div = document.getElementById('crosschain-flags-json');
        const url = `${nodeURL}/zeta-chain/observer/crosschain_flags`;
        const response = await fetch(url);
        const data = await response.json();
        const element = createTreeView(div, data);
    }
    renderCrosschainFlags();

    async function renderBlockParams() {
        const div = document.getElementById('block-params-json');
        const url = `${nodeURL}/cosmos/params/v1beta1/params?subspace=baseapp&key=BlockParams`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        const element = createTreeView(div, data);
    }
    renderBlockParams();
})();
