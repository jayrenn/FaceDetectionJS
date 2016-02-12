(function () {
    "use strict";

    var mirroring = true;
    var mediaCapture;
    var Capture = Windows.Media.Capture;
    var DeviceEnumeration = Windows.Devices.Enumeration;
    var effectDefinition = new Windows.Media.Core.FaceDetectionEffectDefinition();
    var mediaStreamType = Capture.MediaStreamType.videoRecord;
    var captureSettings = new Capture.MediaCaptureInitializationSettings;
    var displayRequest = new Windows.System.Display.DisplayRequest();
    var faceboxColors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"];
    var facesCanvas, video;

    function findCameraDeviceByPanelAsync(panel) {
        var deviceInfo;
        return DeviceEnumeration.DeviceInformation.findAllAsync(DeviceEnumeration.DeviceClass.videoCapture).then(
            function (devices) {
                devices.forEach(function (cameraDeviceInfo) {
                    if (cameraDeviceInfo.enclosureLocation != null && cameraDeviceInfo.enclosureLocation.panel === panel) {
                        deviceInfo = cameraDeviceInfo;
                        return;
                    }
                });

                return !deviceInfo && devices.length > 0 ? devices.getAt(0) : deviceInfo;
            }
        );
    }

    function handleFaces(args) {
        var context = facesCanvas.getContext("2d");
        context.clearRect(0, 0, facesCanvas.width, facesCanvas.height);
        var detectedFaces = args.resultFrame.detectedFaces;
        if (detectedFaces.length > 0) {
            for (var i = 0; i < detectedFaces.length; i++) {
                var face = detectedFaces.getAt(i).faceBox;
                context.beginPath();
                context.rect(face.x, face.y, face.width, face.height);
                context.lineWidth = 3;
                context.strokeStyle = faceboxColors[i % faceboxColors.length];
                context.stroke();
                context.closePath();

                if (mirroring) {
                    facesCanvas.style.transform = "scale(-1, 1)";
                }
            }
        }
    }

    function mirrorPreview() {
        var props = mediaCapture.videoDeviceController.getMediaStreamProperties(Capture.MediaStreamType.videoPreview);
        props.properties.insert("C380465D-2271-428C-9B83-ECEA3B4A85C1", 0);
        return mediaCapture.setEncodingPropertiesAsync(Capture.MediaStreamType.videoPreview, props, null);
    }

    function init() {
        facesCanvas = document.getElementById("facesCanvas");
        video = document.getElementById("video");

        facesCanvas.width = video.offsetWidth;
        facesCanvas.height = video.offsetHeight;

        findCameraDeviceByPanelAsync(DeviceEnumeration.Panel.back).then(
            function (camera) {
                if (camera === null) {
                    console.error("No camera device found!");
                    return;
                }

                mediaCapture = new Capture.MediaCapture();
                captureSettings.videoDeviceId = camera.id;
                captureSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
                mediaCapture.initializeAsync(captureSettings).then(
                    function fulfilled(result) {
                        mediaCapture.addVideoEffectAsync(effectDefinition, mediaStreamType).done(
                            function complete(result) {
                                result.addEventListener("facedetected", handleFaces);
                                result.desiredDetectionInterval = 33;
                            },
                            function error(e) {
                                console.error("Error: " + e);
                            }
                        );

                        displayRequest.requestActive();
                        var preview = document.getElementById("cameraPreview");

                        if (mirroring) {
                            preview.style.transform = "scale(-1, 1)";
                            preview.addEventListener("playing", mirrorPreview);
                        }

                        var previewUrl = URL.createObjectURL(mediaCapture);
                        preview.src = previewUrl;
                        preview.play();
                    },
                    function error(e) {
                        console.error("Error: " + e);
                    }
                );
            }
        );
    }

    document.addEventListener("DOMContentLoaded", init);
})();
