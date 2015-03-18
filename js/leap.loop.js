// loop
var controller = new Leap.Controller({enableGestures: false,frameEventName: 'animationFrame'});
controller.connect();
controller.on('frame', function(frame){

    fps.innerHTML = 'Leap Motion frame rate : ' + Math.round(frame.currentFrameRate);

    // enlever la / les mains non utilisées
    if(frame.hands.length < 2) {
        if(frame.hands.length == 0) {
            if(leftEnable) {
                leftEnable = false;
                hideHand('left')
            }
            if(rightEnable) {
                rightEnable = false;
                hideHand('right')
            }
        } else {
            if(frame.hands[0].type == 'left') {
                leftEnable = true;
                if(rightEnable) {
                    rightEnable = false;
                    hideHand('right')
                }
            }
            if(frame.hands[0].type == 'right') {
                rightEnable = true;
                if(leftEnable) {
                    leftEnable = false;
                    hideHand('left')
                }
            }
        }
    } else { rightEnable = true; leftEnable = true; }

    // boucle des mains
    for (var i = 0, touchHand = []; i < frame.hands.length; i++) {
        hand = frame.hands[i];
        handType = hand.type;
        handPosition = hand.palmPosition;

        // paume
        hand_center[handType].position.set(handPosition[0],handPosition[1],handPosition[2]);

        // boucles des doigts
        for (var j = 0, a = 0, touch = false; j < hand.fingers.length; j++) {
            finger = hand.fingers[j];

            if(finger.dipPosition[2] <= -100 && !touch) {
                touch = true;
                touchHand.push(finger.dipPosition);
            }

            // points
            ar = [finger.dipPosition,finger.pipPosition,finger.mcpPosition];
            for(var b = 0; b < ar.length; b++, a++ )
                array_finger[handType][a].position.set(ar[b][0], ar[b][1], ar[b][2]);

            // traits
            fingerLine(j,finger,handPosition)
        }

        // traits de la paume
        middleHandLine(hand.fingers);

        if(touch) onHand(handType); else offHand(handType);
    }

    // main dans la zone de "touch"
    detect(touchHand);

    spc = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(spc);
    for( var n = 0, c = 0; n < 600; n++, c++) {
        specter[n].position.y = (spc[c] / 3) - 35;
        specter[n].material.color.r =  spc[c] / 200;
        specter[n].material.color.b = spc[c] / 150;
    }

    renderer.render(scene, camera);
    stats.update();
});

// device detected
controller.on('deviceAttached', function(){
    document.getElementById( 'plug').style.opacity = '0';
});

// device removed
controller.on('deviceRemoved', function(){
    document.getElementById( 'plug').style.opacity = '1';
    audio.pause();
    audio.currentTime = 0.0;
});