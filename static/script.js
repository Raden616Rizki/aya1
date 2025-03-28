const video = document.createElement("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let currentFacingMode = "user";

async function setupCamera(facingMode = "user") {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
    });
    video.srcObject = stream;
    video.play();
    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function detectObjects() {
    const model = await cocoSsd.load();
    console.log("Model Loaded");

    async function detectFrame() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const predictions = await model.detect(video);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;

            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = "black";
            ctx.fillRect(x, y - 22, ctx.measureText(text).width + 10, 22);

            ctx.fillStyle = "white";
            ctx.font = "16px 'Outfit', sans-serif";
            ctx.fillText(text, x + 5, y - 5);
        });

        requestAnimationFrame(detectFrame);
    }

    detectFrame();
}

document.getElementById("cameraSwitch").addEventListener("change", async function () {
    currentFacingMode = this.checked ? "environment" : "user";
    await setupCamera(currentFacingMode);
});

setupCamera().then(detectObjects);
