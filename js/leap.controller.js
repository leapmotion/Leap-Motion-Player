// init
var scene = new THREE.Scene(),
    // création de la camera
    camera = new THREE.PerspectiveCamera(60, (window.innerWidth - 25) / (window.innerHeight - 25), 0.1, 2000),
    // init du moteur graphic
    renderer = new THREE.WebGLRenderer(),
    // variable
    array_finger = [],
    array_finger_branch = [],
    hand_center = [],
    hand_global_branch = [],
    light = [],
    collision = [],
    specter = [],
    model_array = ['left','right'],
    leftEnable = false,
    rightEnable = false,
    hand, finger, handType, handPosition, ar,
    fps = document.getElementById('frame'),
    audio = document.getElementById('audio'),
    analyser, spc, positionTrack = [], activTrack;

// analyser
(function(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    analyser = context.createAnalyser();
    var source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    audio.volume = 0.5;
})();

// position de la camera
camera.position.y = 250;
camera.rotation.x = - 0.3;
camera.position.z = 550;

// taille du rendu
renderer.setSize((window.innerWidth - 25),(window.innerHeight - 25));

// rendu dans le container
document.getElementById('display').appendChild(renderer.domElement);

var stats = new Stats();
document.getElementById( 'stat' ).appendChild( stats.domElement );

function getThree(type,size,color,wire) {
    return new THREE.Mesh(new THREE[type](size[0], size[1], size[2]), new THREE.MeshBasicMaterial({color:color, wireframe:!!wire}))
}

function getLine(model){
    return new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial(model));
}

function build_point(type) {
    for(var i = 0, size = [2, 10, 10]; i < 15; i++) {
        array_finger[type][i] = getThree('SphereGeometry',size,'blue',true);
        scene.add(array_finger[type][i]);
    }
}

function init_vertices(nb){
    for(var i = 0, a = []; i < nb; i++)
        a[i] = { x:0, y:0, z:0 };
    return a;
}

function build_branch(type) {
    for(var i = 0; i < 5; i++) {
        array_finger_branch[type][i] = getLine({ color: 'white', linewidth: 4 });
        array_finger_branch[type][i].geometry.vertices = init_vertices(4);
        scene.add(array_finger_branch[type][i]);
    }
}

function hideHand(handType) {
    var n = -2000, ar = [[n,n,n],[n,n,n],[n,n,n]];
    hand_center[handType].position.set(n,n,n);
    for (var j = 0, a = 0; j < 5; j++) {
        for(var b = 0; b < ar.length; b++, a++ )
            array_finger[handType][a].position.set(ar[b][0],ar[b][1],ar[b][2]);
        array_finger_branch[handType][j].geometry.vertices = init_vertices(4);
        hand_global_branch[handType].geometry.vertices = init_vertices(6);
        hand_global_branch[handType].geometry.verticesNeedUpdate = true;
        array_finger_branch[handType][j].geometry.verticesNeedUpdate = true;
    }
}

function onHand(handType){
    if(!light[handType]) {
        light[handType] = true;
        for(var b = 0; b < array_finger[handType].length; b++ )
            array_finger[handType][b].material.color.set('red')
    }
}

function offHand(handType){
    if(light[handType]) {
        light[handType] = false;
        for(var b = 0; b < array_finger[handType].length; b++ )
            array_finger[handType][b].material.color.set('blue')
    }
}

function verticesConvert(a) {
    return {x:a[0],y:a[1],z:a[2]};
}

function middleHandLine(f){
    hand_global_branch[handType].geometry.vertices[0] = verticesConvert(f[0].mcpPosition);
    hand_global_branch[handType].geometry.vertices[1] = verticesConvert(f[1].mcpPosition);
    hand_global_branch[handType].geometry.vertices[2] = verticesConvert(f[2].mcpPosition);
    hand_global_branch[handType].geometry.vertices[3] = verticesConvert(f[3].mcpPosition);
    hand_global_branch[handType].geometry.vertices[4] = verticesConvert(f[4].mcpPosition);
    hand_global_branch[handType].geometry.vertices[5] = verticesConvert(f[0].mcpPosition);
    hand_global_branch[handType].geometry.verticesNeedUpdate = true;
}

function fingerLine(a,f,h) {
    array_finger_branch[handType][a].geometry.vertices[0] = verticesConvert(h);
    array_finger_branch[handType][a].geometry.vertices[1] = verticesConvert(f.mcpPosition);
    array_finger_branch[handType][a].geometry.vertices[2] = verticesConvert(f.pipPosition);
    array_finger_branch[handType][a].geometry.vertices[3] = verticesConvert(f.dipPosition);
    array_finger_branch[handType][a].geometry.verticesNeedUpdate = true;
}

function changeSrc(nb){
    if(audio.src == 'music/'+nb+'.mp3') return;
    audio.pause();
    try { audio.currentTime = 0.0; } catch (e) {}
    audio.src = 'music/'+nb+'.mp3';
    activTrack.geometry.vertices = positionTrack[nb];
    activTrack.geometry.verticesNeedUpdate = true;
}

function onclick(obj,on,off,size,x) {
    obj.touched = false;
    collision.push({
        obj:obj,
        on:on,
        off:(off) ? off : function(){},
        size:size,
        x:(x !== undefined) ? x : null
    })
}

function detect(touchHand) {
    if(touchHand.length > 0) {
        for(var g = 0, x; g < touchHand.length; g++) {
            for(var u = 0; u < collision.length; u++) {
                x = collision[u].x !== null ? collision[u].x : collision[u].obj.position.x;
                if ((touchHand[g][0] > (x - (collision[u].size[0] / 2) ) && touchHand[g][0] < (x + (collision[u].size[0] / 2)) ) &&
                    (touchHand[g][1] > (collision[u].obj.position.y - (collision[u].size[1] / 2) ) && touchHand[g][1] < (collision[u].obj.position.y + (collision[u].size[1] / 2)) )
                ) {
                    if (collision[u].obj.touched == false) {
                        collision[u].obj.touched = true;
                        collision[u].on.call(collision[u].obj)
                    }
                } else if(collision[u].obj.touched == true) {
                    collision[u].obj.touched = false;
                    collision[u].off.call(collision[u].obj)
                }
            }
        }
    } else
        for(var u = 0; u < collision.length; u++)
            if(collision[u].obj.touched == true) {
                collision[u].obj.touched = false;
                collision[u].off.call(collision[u].obj)
            }
}

// cube spectre
(function(){
    for(var i = 0,x = - 332,z = - 170,limit = 29, tmp; i < 600; i++){
        tmp = getThree('BoxGeometry',[20,5,20],'#000');
        tmp.position.x = x;
        tmp.position.z = z;
        scene.add(tmp);
        specter.push(tmp);
        if(limit <= 0) {
            limit = 29;
            x = - 332;
            z += 23;
        } else {
            limit--;
            x += 23;

        }
    }
})();

// création des mains
(function(){
    for(var t = 0, who; who = model_array[t]; t++){
        array_finger_branch[who] = [];
        array_finger[who] = [];
        light[who] = false;
        // trait de la paume
        hand_global_branch[who] = getLine({ color: 'white', linewidth: 4 });
        hand_global_branch[who].geometry.vertices = init_vertices(6);
        scene.add(hand_global_branch[who]);
        // point de la paume
        hand_center[who] = getThree('SphereGeometry',[2, 30, 30],'red');
        scene.add(hand_center[who]);
        // points des mains droite et gauche
        build_point(who);
        // lignes des mains droite et gauche
        build_branch(who);
    }
    // masquer les mains
    hideHand('left');
    hideHand('right');
})();

// play, pause, stop
(function(){
    var tmp;

    //play
    tmp = new THREE.Mesh(new THREE['BoxGeometry'](60, 60, 0), new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/play.png'),
        color:'blue'
    }));
    tmp.position.z = -100;
    tmp.position.y = 350;
    tmp.position.x = -140;
    scene.add(tmp);
    onclick(tmp,function(){
        this.material.color.set('red');
        audio.play();
    },function(){this.material.color.set('blue')},[60,60]);

    // pause
    tmp = new THREE.Mesh(new THREE['BoxGeometry'](60, 60, 0), new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/pause.png'),
        color:'blue'
    }));
    tmp.position.z = -100;
    tmp.position.y = 350;
    scene.add(tmp);
    onclick(tmp,function(){
        this.material.color.set('red');
        audio.pause();
    },function(){this.material.color.set('blue')},[60,60]);

    // stop
    tmp = new THREE.Mesh(new THREE['BoxGeometry'](60, 60, 0), new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/stop.png'),
        color:'red'
    }));
    tmp.position.z = -100;
    tmp.position.y = 350;
    tmp.position.x = 140;
    scene.add(tmp);
    onclick(tmp,function(){
        this.material.color.set('purple');
        audio.pause();
        audio.currentTime = 0.0;
    },function(){this.material.color.set('red')},[60,60]);

})();

// text
positionTrack[1] = [{x:-300 ,y:280 ,z: -100 },{x:300 ,y:280 ,z: -100 },{x:300 ,y:240 ,z: -100 },{x:-300 ,y:240 ,z: -100 },{x:-300 ,y:280 ,z: -100 }];
positionTrack[2] = [{x:-300 ,y:200 ,z: -100 },{x:300 ,y:200 ,z: -100 },{x:300 ,y:160 ,z: -100 },{x:-300 ,y:160 ,z: -100 }, {x:-300 ,y:200 ,z: -100 }];
positionTrack[3] = [{x:-300 ,y:120 ,z: -100 }, {x:300 ,y:120 ,z: -100 }, {x:300 ,y:80 ,z: -100 }, {x:-300 ,y:80 ,z: -100 }, {x:-300 ,y:120 ,z: -100 }];
(function(){
    var fontModel = {size: 20, height: 5, curveSegments: 6, font: "helvetiker", weight: "bold"}, color = '#474343', tmp;

    tmp = new THREE.Mesh(new THREE['TextGeometry']('SmallRadio - LSF 7th Gear Remix',fontModel), new THREE.MeshBasicMaterial({color:color}));
    tmp.position.z = -100;
    tmp.position.y = 250;
    tmp.position.x = -208;
    scene.add(tmp);
    onclick(tmp,function(){changeSrc(1)},null,[600,60],0);

    tmp = new THREE.Mesh(new THREE['TextGeometry']('Pornophonique - Space Invaders',fontModel), new THREE.MeshBasicMaterial({color:color}));
    tmp.position.z = -100;
    tmp.position.y = 170;
    tmp.position.x = -206;
    scene.add(tmp);
    onclick(tmp,function(){changeSrc(2)},null,[600,60],0);

    tmp = new THREE.Mesh(new THREE['TextGeometry']('Mizuki s Last Chance - Yeah',fontModel), new THREE.MeshBasicMaterial({color:color}));
    tmp.position.z = -100;
    tmp.position.y = 90;
    tmp.position.x = -178;
    scene.add(tmp);
    onclick(tmp,function(){changeSrc(3)},null,[600,60],0);

    activTrack = getLine({ color: 'white', linewidth: 4 });
    activTrack.geometry.vertices = positionTrack[1];
    scene.add(activTrack);

})();