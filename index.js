const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');

function pointToString(point) {
    var x = point.x.toFixed(2);
    var y = point.y.toFixed(2);
    var z = point.z.toFixed(2);

    return `(${x}, ${y}, ${z})`;
}

function distance(p1, p2) {
    // Euclidean distance between two positions
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
}

function binarySearch(arr, x) {
    // Return index that x should be inserted into arr (which is sorted in increasing order)
    // TODO: use linked list instead of array for performance?
    var i = 0,
        j = arr.length,
        mid,
        y;
    while (i < j) {
        mid = Math.floor((i+j)/2);
        y = arr[mid];
        if (x == y) {
        	return mid;
        } else if (x < y) {
            j = mid;
        } else {
            i = mid+1;
        }
    }
    return i;
}

function createGraph(sweeps, sweep_positions) {
    // Given list of sweeps, return graph adjacency list.
    // Returns: adjList[sweep_a_uuid][sweep_b_uuid] -> float (representing distance in meters)
    const adjList = {};
    for (let i=0; i<sweeps.length; i++) {
        const sweep_a = sweeps[i];
        adjList[sweep_a.sid] = {};
        const neighbors = sweep_a.neighbors;
        for (let j=0; j<neighbors.length; j++) {
            const sweep_b_sid = neighbors[j];
            const d = distance(sweep_a.position, sweep_positions[sweep_b_sid]);
            adjList[sweep_a.sid][sweep_b_sid] = d;
        }
    }
    return adjList;
}

function dijkstra(swl_a_sid, swl_b_sid, adjList) {
    
}

// ----------------------------------------------------------------------------

// Put model SID here
const model_sid = 'CDnv6RJDQ3d';

// Check if domain is `kevinddchen.github.io` or `localhost`, and pick SDK key accordingly
let key;
const domain = document.location.hostname;
if (domain == 'localhost') {
    key = 'e0iyprwgd7e7mckrhei7bwzza';
} else if (domain == 'kevinddchen.github.io') {
    key = 'q44m20q8yk81yi0qgixrremda';
} else {
    console.log('Invalid domain name: '+domain)
}
showcase.src='bundle/showcase.html?m='+model_sid+'&play=1&qs=1&applicationKey='+key;

showcase.addEventListener('load', async function() {

    // connect to SDK
    let sdk;
    try {
        sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key);
        console.log('%cSDK Connected!', 'background: #333333; color: #00dd00');
    }
    catch(e) {
        console.error(e);
        return;
    }

    // create node graph
    const sweep_positions = {}; // sweep_positions[sweep_sid] -> Vector3
    let adjList; // adjList[sweep_a_sid][sweep_b_sid] -> float (representing distance in meters)
    sdk.Model.getData().then( data => {
        data.sweeps.map( x => {sweep_positions[x.sid] = x.position});
        console.log(sweep_positions);
        adjList = createGraph(data.sweeps, sweep_positions);
        console.log(adjList);
    });
    
    // track current sweep position
    sdk.Sweep.current.subscribe(function(currSweep) {
        sweep_pos.innerHTML = `current position: ${pointToString(currSweep.position)}`;
        if (currSweep.sid !== '') {
            console.log(currSweep.uuid);
        }
    });

    // track pointer position
    sdk.Pointer.intersection.subscribe(function(interData) {
        point_pos.innerHTML = `pointer position: ${pointToString(interData.position)}`;
    });

});

