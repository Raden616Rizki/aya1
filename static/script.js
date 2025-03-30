const video = document.createElement("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let currentFacingMode = "user";

async function setupCamera(facingMode = "user") {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    try {
        const constraints = { video: { facingMode: facingMode } };

        if (facingMode === "environment") {
            constraints.video.facingMode = { exact: "environment" };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                adjustCanvasSize();
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
}

function adjustCanvasSize() {
    const aspectRatio = video.videoWidth / video.videoHeight;

    if (!aspectRatio || isNaN(aspectRatio)) {
        canvas.width = Math.min(window.innerWidth - 40, 640);
        canvas.height = (canvas.width / 4) * 3;
    } else {
        canvas.width = Math.min(window.innerWidth - 40, 640);
        canvas.height = canvas.width / aspectRatio;
    }

    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
}

window.addEventListener("resize", adjustCanvasSize);

async function detectObjects() {
    const model = await cocoSsd.load();
    console.log("Model Loaded");

    async function detectFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const predictions = await model.detect(video);

        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;

            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

            ctx.fillStyle = "black";
            ctx.fillRect(scaledX, scaledY - 22, ctx.measureText(text).width + 10, 22);

            ctx.fillStyle = "white";
            ctx.font = "16px 'Outfit', sans-serif";
            ctx.fillText(text, scaledX + 5, scaledY - 5);
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
