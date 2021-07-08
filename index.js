const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');
const key1 = 'q44m20q8yk81yi0qgixrremda';
const key2 = 'e0iyprwgd7e7mckrhei7bwzza';

function pointToString(point) {
    var x = point.x.toFixed(2);
    var y = point.y.toFixed(2);
    var z = point.z.toFixed(2);

    return `(${x}, ${y}, ${z})`;
}

showcase.addEventListener('load', async function() {
    let sdk;
    try {
        try {
            // try to host on `kevinddchen.github.io`
            sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key1);
        } catch {
            // try to host on `localhost`
            sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key2);
        }
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

