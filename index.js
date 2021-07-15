const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');

const modelSID = 'opSBz3SgMg3';

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

// --- Pathfinding ------------------------------------------------------------

const VERT_THRESHOLD = 0.5; // penalize sweeps vertically separated by this distance, in meters
const HORZ_THRESHOLD = 5.0; // penalize sweeps horizontally separated by this distance, in meters

function distance(p1, p2) {
    // Euclidean distance between two points
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
    
function heuristic(i_sid, j_sid, sweepPositions) {
    // Heuristic function for A*. Just take Euclidean distance.
    return distance(sweepPositions[i_sid], sweepPositions[j_sid]);
}

function penalty(i_sid, j_sid, sweepPositions) {
    // Additional penalty to avoid large vertical/horizontal jumps, if possible
    return ((sweepPositions[i_sid].y - sweepPositions[j_sid].y)/VERT_THRESHOLD)**4 
        +  (((sweepPositions[i_sid].x - sweepPositions[j_sid].x)**2 + (sweepPositions[i_sid].z - sweepPositions[j_sid].z)**2)/HORZ_THRESHOLD)**2;
}

/**
 * Find shortest path between two sweeps, connected by valid movements.
 * @param {string} a_sid SID of starting sweep
 * @param {string} b_sid SID of ending sweep
 * @param {*} adjList Graph of sweep distances, as returned by `createGraph`
 * @param {*} sweepPositions Table of sweep positions
 * @returns Path represented by list of sweep SIDs (string) in reverse order, i.e. [b_sid, ..., a_sid]
 */
function findShortestPath(a_sid, b_sid, adjList, sweepPositions) {

    // check SIDs are valid
    if (adjList[a_sid] === undefined || adjList[b_sid] === undefined) {
        console.error("Sweep SID(s) is invalid.");
        return;
    }

    const ht = {}; // hash table that stores the following info for each encountered sweep:
    ht[a_sid] = {"visited": false, "distance": 0, "cost": 0, "parent": null};

    // loop A* algorithm
    let debug_n = 0; // count number of iterations

    while (true) {
        debug_n += 1;
        // find unvisited sweep with minimum cost = distance  + heuristic
        // TODO: optimize with priority queue
        let min_sid;
        const encountered_sids = Object.keys(ht);
        for (let i=0; i<encountered_sids.length; i++) {
            const sid = encountered_sids[i];
            if (!ht[sid].visited && (min_sid === undefined || ht[sid].cost < ht[min_sid].cost)) {
                min_sid = sid;
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
        // add all neighbors of `min_sid`
        ht[min_sid].visited = true;
        const neighbor_sids = Object.keys(adjList[min_sid]);
        for (let i=0; i<neighbor_sids.length; i++) {
            const sid = neighbor_sids[i];
            const dist = ht[min_sid].distance + adjList[min_sid][sid];
            const cost = dist + penalty(min_sid, sid, sweepPositions) + heuristic(sid, b_sid, sweepPositions);
            if (sid in ht) { // if sweep has been encountered
                if (!ht[sid].visited && (ht[sid].cost > cost)) { // if not visited and smaller cost, then update
                    ht[sid].parent = min_sid;
                    ht[sid].distance = dist;
                    ht[sid].cost = cost;
                }
            } else { // if sweep has not been encountered yet
                ht[sid] = {"visited": false, "distance": dist, "cost": cost, "parent": min_sid};
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
    console.log("Pathfind iterations: %d", debug_n);
    return path;
}

// ----------------------------------------------------------------------------

// Path segment component factory

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

// ----------------------------------------------------------------------------

/**
 * Convenience function for printing points.
 */
 function pointToString(point) {
    var x = point.x.toFixed(2);
    var y = point.y.toFixed(2);
    var z = point.z.toFixed(2);
    return `(${x}, ${y}, ${z})`;
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
    const sweepPositions = {}; // hash table keeping track of sweep positions: `sweepPositions[sweep_sid] -> Vector3`
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
            const endSweepId = '5b6fac032d3a4068bd4febf7770c22ff';
            const path = findShortestPath(currSweep.sid, endSweepId, adjList, sweepPositions);

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

