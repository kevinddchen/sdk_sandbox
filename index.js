const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
const sweep_pos = document.getElementById('sweep_pos');
const key = '3nuu1ekiezi63rua0wy7tcmub';

function pointToString(point) {
  var x = point.x.toFixed(2);
  var y = point.y.toFixed(2);
  var z = point.z.toFixed(2);

  return `(${x}, ${y}, ${z})`;
}

showcase.addEventListener('load', async function() {
    let sdk;
    try {
        sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key, '');
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

    sdk.Mattertag.getData().then(function(mattertags) {
        console.log(mattertags)
    });

});

