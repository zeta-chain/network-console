var nodeURL = 'http://46.4.15.110:1317';
var evmURL = 'http://46.4.15.110:8545';
var corsProxyURL = 'http://3.132.197.22:8088';
var checkURL = 'http://46.4.15.110:8888'; // remote server that tests port 6668 p2p nodes
var tmURL = 'http://46.4.15.110:26657';
var hashServerURL = 'http://46.4.15.110:9001';

var RPCByChainID = {
    5: "https://rpc.ankr.com/eth_goerli",
    97: "https://data-seed-prebsc-1-s1.binance.org:8545",
    80001: "https://rpc-mumbai.maticvigil.com",
    18332: "https://blockstream.info/testnet/api", 
};

if (window.location.protocol === 'https:') {
    alert('HTTPS does not work; force your browser to use HTTP instead.');
}



// summary & details are text; div is container
// returns a div
function addDetails(summary, details) {
    const div = document.createElement('div');
    const detailsElement = document.createElement('details');
    const summaryElement = document.createElement('summary');
    const preElement = document.createElement('pre');
    preElement.textContent = details;
    summaryElement.textContent = summary;
    detailsElement.appendChild(summaryElement);
    detailsElement.appendChild(preElement);
    div.appendChild(detailsElement);
    return div; 
}
