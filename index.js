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

function createGraph(sweeps) {
    // Given list of sweeps, return graph adjacency list.
    // Returns: adjList[sweep_a_uuid][sweep_b_uuid] -> distance as float
    // ! Note: assumes graph is undirected, i.e. if A is a neighbor of B, then B is a neighbor of A !
    const adjList = {};
    const positions = {}; // keep track of sweep positions
    for (let i=0; i<sweeps.length; i++) {
        const swl_a = sweeps[i];
        adjList[swl_a.sid] = {};
        positions[swl_a.sid] = swl_a.position;

        const neighbors = swl_a.neighbors;
        for (let j=0; j<neighbors.length; j++) {
            const swl_b_sid = neighbors[j];
            if (swl_b_sid in adjList) { // if sweep already visited, we know its position
                const d = distance(swl_a.position, positions[swl_b_sid]);
                adjList[swl_a.sid][swl_b_sid] = d;
                adjList[swl_b_sid][swl_a.sid] = d;
            }
        }
    }
    return adjList;
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
    let sweeps;
    let adjList;
    sdk.Model.getData().then( function(data) {
        sweeps = data.sweeps;
        adjList = createGraph(data.sweeps);
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

