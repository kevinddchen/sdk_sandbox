const model_sid = 'CDnv6RJDQ3d';
const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');

function pointToString(point) {
    var x = point.x.toFixed(2);
    var y = point.y.toFixed(2);
    var z = point.z.toFixed(2);

    return `(${x}, ${y}, ${z})`;
}

// check if domain is `kevinddchen.github.io` or `localhost`
let key;
const domain = document.location.hostname
if (domain == 'localhost') {
    key = 'e0iyprwgd7e7mckrhei7bwzza';
} else if (domain == 'kevinddchen.github.io') {
    key = 'q44m20q8yk81yi0qgixrremda';
} else {
    console.log('Invalid domain name: '+domain)
}
showcase.src='bundle/showcase.html?m=CDnv6RJDQ3d&play=1&qs=1&applicationKey='+key;



// --- START OF EMBEDDING ---

showcase.addEventListener('load', async function() {
    let sdk;
    try {
        sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key);
    }
    catch(e) {
        console.error(e);
        return;
    }

    console.log('%cSDK Connected!', 'background: #333333; color: #00dd00');
    console.log(sdk);

    sdk.Sweep.current.subscribe(function(currSweep) {
        sweep_pos.innerHTML = `current position: ${pointToString(currSweep.position)}`;
    });

    sdk.Pointer.intersection.subscribe(function(interData) {
        point_pos.innerHTML = `pointer position: ${pointToString(interData.position)}`;
    });

});

