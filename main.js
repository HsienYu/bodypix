/* 
=============
Params
=============
*/

let imageSize = {
    width: 1280,
    height: 720
};
let capture;
let pixelNoiseSlider;
let mic;

// ===== BodyPix =====
let modelConfigParams;
let mobilenetConfigParams = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2
}
let resnetConfigParams = {
    architecture: 'ResNet50',
    outputStride: 16,
    quantBytes: 2
}
let enableMultiPersonSegment;
let numberOfPredict = 5;
let segmentation;


/* 
=============
Function
=============
*/

function setup() {
    let cnv = createCanvas(windowWidth,windowHeight);
    cnv.mouseClicked(userStartAudio); // Start handling Audio when the screen is clicked

    // init bodypix param
    //modelConfigParams = mobilenetConfigParams;
    modelConfigParams = resnetConfigParams;
    enableMultiPersonSegment = false;

    // to get microphone volume
    mic = new p5.AudioIn();
    mic.start();

    setupCamera();

    background(0);
    //text("Wait for setup...", 20, 20);
    //pixelNoiseSlider = createSlider(0,500,300);
    //pixelNoiseSlider.position(20,50);
}

function setupCamera(id = ""){
    if(id == ""){
        capture = createCapture(VIDEO, captureLoaded);
    }else{
        let option = {
            video: {
                deviceId: id,
                width: imageSize.width,
                height: imageSize.height
            },
            audio: true
        };
        capture = createCapture(option, captureLoaded);
    }
    capture.hide();
}

function captureLoaded(){
    console.log("capture loaded...");
    loadTfModel();
}

async function loadTfModel(){
    await bodyPix.load(modelConfigParams).then(function(loadedNet){
        net = loadedNet;
        console.log("bodyPix loaded...");
        predict();
    })
}

async function predict() {
    if(enableMultiPersonSegment){
        await net.segmentMultiPerson(capture.elt, {
            flipHorizontal: false,
            internalResolution: 'medium',
            segmentationThreshold: 0.5,
            maxDetections: numberOfPredict
        }).then(function(personSegmentation){
            segmentation = personSegmentation;

            drawWhenPredicted();
            predict();
            
        })
    }else{
        await net.segmentPerson(capture.elt, {
            flipHorizontal: false,
            internalResolution: 'medium',
            segmentationThreshold: 0.5,
            nmsRadius: 20,
            refineSteps: 10

        }).then(function(personSegmentation){
            segmentation = personSegmentation;

            drawWhenPredicted();
            predict();
        })
    }
}

function drawWhenPredicted(){
    background(0);

    push();
    scale(-1,1);
    // image(capture,0,0,windowWidth,windowHeight);
    image(capture, -windowWidth, 0, windowWidth, windowHeight);
    pop();
    
    if(segmentation != undefined){
        updateBodyPixPixels().then(() => console.log("updated pixels..."));
    }

    // fill(255,150);
    // rect(0, 0, 180, 80);
    // fill(0);
    // text("'f'key: fullscreen", 20, 20);
    // text('PixelNoise: '+String(pixelNoiseSlider.value()), pixelNoiseSlider.x, pixelNoiseSlider.y-10);
}

async function updateBodyPixPixels(){
    let img = createImage(segmentation.width, segmentation.height);
    img.loadPixels();
    capture.loadPixels();

    // Update bodypix's segmented pixels
    for(let y=0;y<img.height;y++){
        let param = 200; // pixelNoiseSlider.value();
        let pixelNoise = Math.floor(noise(y*mic.getLevel()*0.2)*param-param/2);
        for(let x=0;x<img.width;x++){
            let index = (x + y * img.width);
            if(segmentation.data[index]){
                let index_ = index+pixelNoise
                if(index_>img.width*img.height){
                    index_=index;
                }
                // capture.pixels[index*4] = 0;
                // capture.pixels[index*4 + 1] = 0;
                // capture.pixels[index*4 + 2] = 0;
                // capture.pixels[index*4 + 3] = 0;
                img.pixels[index*4] = capture.pixels[index_*4];
                img.pixels[index*4 + 1] = capture.pixels[index_*4 + 1];
                img.pixels[index*4 + 2] = capture.pixels[index_*4 + 2];
                img.pixels[index*4 + 3] = capture.pixels[index_*4 + 3];

                // img.pixels[index*4] = random(255);
                // img.pixels[index*4 + 1] = capture.pixels[index_*4 + 1];
                // img.pixels[index*4 + 2] = capture.pixels[index_*4 + 2];
                // img.pixels[index*4 + 3] = capture.pixels[index_*4 + 3];
            }else{
                let index_ = index+pixelNoise
                if(index_>img.width*img.height){
                    index_=index;
                }
                // capture.pixels[index*4] = 0;
                // capture.pixels[index*4 + 1] = 0;
                // capture.pixels[index*4 + 2] = 0;
                // capture.pixels[index*4 + 3] = 0;
                // img.pixels[index*4] = capture.pixels[index_*4];
                // img.pixels[index*4 + 1] = capture.pixels[index_*4 + 1];
                // img.pixels[index*4 + 2] = capture.pixels[index_*4 + 2];
                // img.pixels[index*4 + 3] = capture.pixels[index_*4 + 3];
            }
        }
    }
    
    img.updatePixels();
    capture.updatePixels();

    push();
    scale(-1,1);
    // image(img, 0, 0, windowWidth, windowHeight);
    image(img, -windowWidth, 0, windowWidth, windowHeight);
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyTyped() {
    switch (key) {
        case 'f':
            let fs = fullscreen();
            fullscreen(!fs);
            break;
        default:
            break;
    }
}