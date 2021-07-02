const showcase = document.getElementById('showcase');
const point_pos = document.getElementById('point_pos');
//const key = '3nuu1ekiezi63rua0wy7tcmub';
const key = 'e5mzs2ykckg3m4ih104w6i5gb';

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

    sdk.Pointer.intersection.subscribe(function(intersection) {
        point_pos.innerHTML = `pointer position: ${pointToString(intersection.position)}`;
    });
});

