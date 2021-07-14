const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');

/**
 * Convenience function for printing points.
 */
function pointToString(point) {
    var x = point.x.toFixed(2);
    var y = point.y.toFixed(2);
    var z = point.z.toFixed(2);
    return `(${x}, ${y}, ${z})`;
}

/**
 * Euclidean distance between two points.
 */
function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
}

/**
 * Generate graph of sweep distances. Assumes graph is undirected.
 * @param {*} sweeps List of sweeps, as returned by `sdk.Model.getData().sweeps`
 * @returns The distance between two neighboring sweeps is obtained by `adjList[sweep_a_sid][sweep_b_sid]`
 */
function createGraph(sweeps) {
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

/**
 * Find shortest path between two sweeps, connected by valid movements.
 * @param {string} a_sid SID of starting sweep
 * @param {string} b_sid SID of ending sweep
 * @param {*} adjList Graph of sweep distances, as returned by `createGraph`
 * @returns Path represented by list of sweep SIDs (string) in reverse order, i.e. [b_sid, ..., a_sid]
 */
function findShortestPath(a_sid, b_sid, adjList) {
    // check SIDs are valid
    if (adjList[a_sid] === undefined || adjList[b_sid] === undefined) {
        console.error("Sweep SID(s) is invalid.");
        return;
    }

    // loop Dijkstra's algorithm
    // TODO: upgrade to A*
    const ht = {}; // hash table that stores the following info for each encountered sweep:
    ht[a_sid] = {"visited": false, "distance": 0, "parent": null};
    
    while (true) {
        // find unvisited sweep with minimum distance
        // TODO: optimize with priority queue
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
    path = [sid];
    while (ht[sid].parent !== null) {
        sid = ht[sid].parent;
        path.push(sid);
    }
    return path;
}

// ----------------------------------------------------------------------------

// Put model SID here
const modelSID = 'CDnv6RJDQ3d';

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
showcase.src=`bundle/showcase.html?m=${modelSID}&play=1&qs=1&applicationKey=${key}`;

// Path component factory

/**
 * Draws a smooth elongated tube along the given path
 */
function Path() {
    this.inputs = {
        visible: false,
        path: [], // positions on path
        radius: 0.15,
        color: 0x00ff00,
        opacity: 0.5,
        heightOffset: -1,
        stepMultiplier: 5,
    };
 
    this.onInit = async function() {

        const { path,
                radius,
                heightOffset,
                opacity, color,
                stepMultiplier } = this.inputs;

        // check if path is long enough and no undefined points
        if (path.length < 2 || !path.every(p => !!p)) return;
        
        let THREE = this.context.three;

        const points = path.map(p => new THREE.Vector3(p.x, p.y+heightOffset, p.z));
        const spline = new THREE.CatmullRomCurve3(points);

        const extrudeSettings = {
            steps: stepMultiplier * path.length,
            bevelEnabled: false,
            extrudePath: spline,
        };

        // Shape to extrude
        const arcShape = new THREE.Shape()
            .absarc( 0, 0, radius, 0, Math.PI * 2 );
        
        const extrudeGeometry = new THREE.ExtrudeGeometry( arcShape, extrudeSettings );
        
        this.material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
        });

        const pathMesh = new THREE.Mesh(extrudeGeometry, this.material)

        this.outputs.objectRoot = pathMesh;
    };
 
    this.onEvent = function(type, data) {
    }
 
    this.onInputsUpdated = function(previous) {
    };
 
    this.onTick = function(tickDelta) {
    };
 
    this.onDestroy = function() {
        this.material.dispose();
    };
}

function PathFactory() {
    return new Path();
}

// Path rendering

/**
 * Renders the given path
 * @param {MP_SDK} sdk The active sdk object
 * @param {INode[]} node Variable to track active node
 * @param {*} sweepData A mapping of ALL sweep ids to their positions
 * @param {string} sweepIds A list of sweep IDs (the path)
 */
async function renderPath(sdk, node, sweepData, sweepIds) {
    // if anything is undefined or there is no multi-sweep path, return
    if (!sweepData || !sweepIds || sweepIds.length < 2) return;

    node.addComponent('path', {
        path: sweepIds.map(id => sweepData[id]),
        opacity: 0.6,
        radius: 0.08,
        stepMultiplier: 10,
        color: 0x8df763,
    });
    node.start();
}

// Showcase runtime code

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
    const sweepPositions = {}; // object keeping track of sid: position pairs
    let adjList; // see `createGraph` for usage
    sdk.Model.getData().then( data => {
        data.sweeps.map( x => {sweepPositions[x.sid] = x.position});
        adjList = createGraph(data.sweeps);
        console.log("Graph of sweep distances:", adjList);
    });
    
    sdk.Scene.register('path', PathFactory); // register component

    let node; // variable to track active node

    // track current sweep position
    sdk.Sweep.current.subscribe(async function(currSweep) {
        sweep_pos.innerHTML = `current position: ${pointToString(currSweep.position)}`;
        if (currSweep.sid !== '') {
            console.log(`current sweep SID: ${currSweep.sid}`);

            // pathfinding
            const endSweepId = 'bdef2d34bf7642be9e514686a262c158';
            const path = findShortestPath(currSweep.sid, endSweepId, adjList);

            if (node) node.stop();
            node = await sdk.Scene.createNode();
            renderPath(sdk, node, sweepPositions, path);
        }
    });

    // track pointer position
    sdk.Pointer.intersection.subscribe(function(interData) {
        point_pos.innerHTML = `pointer position: ${pointToString(interData.position)}`;
    });

});

