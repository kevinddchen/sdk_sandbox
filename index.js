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
    /* Euclidean distance between two points.

    Args
        p1 (Vector3): First point
        p2 (Vector3): Second point
    Returns
        (float): Euclidean distance in meters
    */
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
}

function createGraph(sweeps) {
    /* Generate graph of sweep distances. Assumes graph is undirected.

    Args
        sweeps: List of sweeps, as returned by `sdk.Model.getData().sweeps`
    Returns
        adjList (object): The distance between two neighboring sweeps is obtained by `adjList[sweep_a_sid][sweep_b_sid]`
    */
    const adjList = {};
    const position_cache = {}; // keep track of encountered sweep positions
    for (let i=0; i<sweeps.length; i++) {
        const sweep_a = sweeps[i];
        adjList[sweep_a.sid] = {};
        position_cache[sweep_a.sid] = sweep_a.position;

        const neighbor_sids = sweep_a.neighbors;
        for (let j=0; j<neighbor_sids.length; j++) {
            const sweep_b_sid = neighbor_sids[j];
            if (sweep_b_sid in position_cache) { // if sweep already visited, we know its position
                const d = distance(sweep_a.position, position_cache[sweep_b_sid]);
                adjList[sweep_a.sid][sweep_b_sid] = d;
                adjList[sweep_b_sid][sweep_a.sid] = d; // this only works if graph is undirected, i.e. A neighbor of B => B neighbor of A
            }
        }
    }
    return adjList;
}

function findShortestPath(a_sid, b_sid, adjList) {
    /* Find shortest path between two sweeps, connected by valid movements.

    Args
        a_sid (string): SID of starting sweep
        b_sid (string): SID of ending sweep
        adjList: Graph of sweep distances, as returned by `createGraph`
    Returns
        (list of strings): List of SIDs in reverse order, [b_sid, ..., a_sid]
    */
        
    // check SIDs are valid
    if (adjList[a_sid] === undefined || adjList[b_sid] === undefined) {
        console.error("Sweep SID(s) is invalid.");
        return;
    }

    const ht = {}; // hash table that stores the following info for each encountered sweep:
    ht[a_sid] = {"visited": false, "distance": 0, "parent": null};

    // loop Dijkstra's algorithm
    while (true) {
        // find unvisited sweep with minimum distance
        // Note: this step is not efficient, but thats OK for now
        let min_sid,
            min_dist;
        const encountered_sids = Object.keys(ht);
        for (let i=0; i<encountered_sids.length; i++) {
            const sid = encountered_sids[i];
            if (!ht[sid].visited && (min_dist === undefined || ht[sid].distance < min_dist)) {
                min_sid = sid;
                min_dist = ht[sid].distance;
            }
        }
        if (min_sid === undefined) {
            console.error("Could not find path; sweeps are not connected.");
            return;
        }
        // check if sweep is ending point
        if (min_sid === b_sid) {
            break;
        }
        // add all neighbors to hash table
        ht[min_sid].visited = true;
        const neighbor_sids = Object.keys(adjList[min_sid]);
        for (let i=0; i<neighbor_sids.length; i++) {
            const sid = neighbor_sids[i];
            const dist = adjList[min_sid][sid];
            if (sid in ht) { // if sweep has been encountered
                if (!ht[sid].visited && (ht[sid].distance > min_dist+dist)) { // if not visited, update parent and distance
                    ht[sid].parent = min_sid;
                    ht[sid].distance = min_dist+dist;
                }
            } else { // if sweep has not been encountered yet
                ht[sid] = {"visited": false, "distance": min_dist+dist, "parent": min_sid};
            }
        }
    }
    // traverse graph back to starting point
    var sid = b_sid;
    arr = [sid];
    while (ht[sid].parent !== null) {
        sid = ht[sid].parent;
        arr.push(sid);
    }
    return arr;
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
    const sweep_positions = {}; // object keeping track of sid: position pairs
    let adjList; // see `createGraph` for usage
    sdk.Model.getData().then( data => {
        const sweeps = data.sweeps;
        sweeps.map( x => {sweep_positions[x.sid] = x.position});
        adjList = createGraph(sweeps);
        console.log("Graph of sweep distances:", adjList);
    });
    
    // track current sweep position
    sdk.Sweep.current.subscribe(function(currSweep) {
        sweep_pos.innerHTML = `current position: ${pointToString(currSweep.position)}`;
        if (currSweep.sid !== '') {
            console.log(`current sweep SID: ${currSweep.sid}`);
        }
    });

    // track pointer position
    sdk.Pointer.intersection.subscribe(function(interData) {
        point_pos.innerHTML = `pointer position: ${pointToString(interData.position)}`;
    });

});

