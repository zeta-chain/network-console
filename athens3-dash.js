function toggleDropdown(dropdownId) {
    var dropdown = document.getElementById(dropdownId);
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
  }


fetch('http://3.132.197.22:8088/http://3.218.170.198:1317/zeta-chain/crosschain/keygen', {
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
    div2.textContent = JSON.stringify(summary, null, 2);
}).catch(error => {
    console.log("fetch error" + error);
})

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
    // div2.textContent = 'Block Height: ' + data.result.sync_info.latest_block_height;
    let utcString = data.result.sync_info.latest_block_time;
    let utcDate = new Date(utcString);
    // div2.textContent += "\n" + "Latest block timestamp: " + utcDate.toLocaleString();
    let summary = {"block height": data.result.sync_info.latest_block_height, "block timestamp": utcDate.toLocaleString()};
    div2.textContent = JSON.stringify(summary, null, 2);
}).catch(error => {
    console.log("fetch error" + error);
})