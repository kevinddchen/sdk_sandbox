const showcase = document.getElementById('showcase');
const curr_pos_text = document.getElementById('curr_pos');

//const sdkKey = 'w766rytyif2s4dfetxhsc3hgd';
const sdkKey = '3nuu1ekiezi63rua0wy7tcmub';
const modelSID = 'SxQL3iGyoDo';

function pointToString(point) {
  var x = point.x.toFixed(2);
  var y = point.y.toFixed(2);
  var z = point.z.toFixed(2);

  return `(${x}, ${y}, ${z})`;
}

var tags = [
{
    label: 'video'
    , anchorPosition: {x: 0, y: 0, z: 0}
    , stemVector: {x: 0, y: 1, z:0}
    , media: {
        type: 'mattertag.media.video'
        , src: 'https://www.youtube.com/watch?v=slGuiRZ-yXY'
    }
},{
    label:'image'
    , anchorPosition: {x: 1, y: 0, z: 0}
    , stemVector: {x: 0, y: 1, z: 0}
    , media: {
        type: 'mattertag.media.photo'
        , src: 'https://www.pets4homes.co.uk/images/articles/2827/large/5-popular-flat-faced-cat-breeds-55460d3d0be16.jpg'
    }
}]

//iframe.src = `https://my.matterport.com/show?m=${modelSID}&play=1`;
//iframe.src = `https://dev-app.matterport.com/show?m=zdTS1XED4CU&play=1`;

showcase.contentWindow.MP_SDK.connect(showcase, sdkKey).then(async function(mpSdk){

    console.log('SDK Success!');

    var tag_ids
    await mpSdk.Mattertag.add(tags).then(function(ids) {
        tag_ids = ids;
        console.log(tag_ids);
    });

    mpSdk.Mattertag.preventAction(tag_ids[0], {
        navigating: true
    });

    mpSdk.on('tag.click', function(x) {
        console.log(x);
        console.log('yes');
    });

    mpSdk.Pointer.intersection.subscribe(function(intersection) {
        curr_pos_text.innerHTML = `current position: ${pointToString(intersection.position)}`;
    });



});

